import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, stepCountIs } from "ai";
import { weatherTool, stockTool, f1Tool } from "@/app/ai-tools";
import { db } from "@/db";
import { messages as messagesTable, chats } from "@/db/schema";
import { auth } from "@/config/authHandler";
import { eq, and } from "drizzle-orm";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { messages, chatId } = await req.json();

        if (!chatId) {
            return new Response("Chat ID required", { status: 400 });
        }

        // Verify chat belongs to user
        const chat = await db.select().from(chats)
            .where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)))
            .limit(1);

        if (chat.length === 0) {
            return new Response("Chat not found", { status: 404 });
        }

        // Save user message
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage?.role === "user") {
            await db.insert(messagesTable).values({
                chatId,
                role: "user",
                content: lastUserMessage.content,
            });
        }

        console.log("Starting streamText with messages:", messages.length);

        const result = streamText({
            model: google("gemini-2.5-flash"),
            system: "You are Rudra AI, a helpful assistant. You can check weather, stock prices, and F1 race info using your tools. Always use the appropriate tool when asked about weather, stocks, or F1. Be friendly and concise.",
            messages: messages,
            tools: {
                getWeather: weatherTool,
                getStockPrice: stockTool,
                getF1Race: f1Tool,
            },
            stopWhen: stepCountIs(5),

            onFinish: async ({ text, steps }) => {
                console.log("onFinish called - text:", text?.slice(0, 100), "steps:", steps?.length);

                let finalToolInvocations: unknown[] | null = null;

                if (steps && steps.length > 0) {
                    const allTools: unknown[] = [];

                    // Collect all tool results
                    for (const step of steps) {
                        console.log("Step toolResults:", step.toolResults?.length || 0);
                        if (step.toolResults) {
                            for (const toolResult of step.toolResults) {
                                allTools.push({
                                    toolCallId: toolResult.toolCallId,
                                    toolName: toolResult.toolName,
                                    result: toolResult.output,
                                });
                            }
                        }
                    }

                    // Filter out failed tool results
                    finalToolInvocations = allTools.filter((item: unknown) => {
                        const tool = item as { toolName: string; result: Record<string, unknown> };
                        const res = tool.result;
                        if (!res) return false;

                        // Filter out failed weather
                        if (tool.toolName === "getWeather" && res.condition === "Unknown Location") {
                            return false;
                        }
                        // Filter out failed stock
                        if (tool.toolName === "getStockPrice" && (res.price === 0 || res.price === "0")) {
                            return false;
                        }
                        // Filter out failed F1
                        if (tool.toolName === "getF1Race" && res.raceName === "Unknown Race") {
                            return false;
                        }

                        return true;
                    });
                }

                const hasContent = text && text.trim().length > 0;
                const hasTools = finalToolInvocations && finalToolInvocations.length > 0;

                console.log("Saving to DB - hasContent:", hasContent, "hasTools:", hasTools);

                if (hasContent || hasTools) {
                    try {
                        await db.insert(messagesTable).values({
                            chatId,
                            role: "assistant",
                            content: text || "",
                            toolInvocations: finalToolInvocations,
                        });
                        console.log("Message saved successfully");
                    } catch (err) {
                        console.error("Database insert failed:", err);
                    }
                }
            },
        });

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
}
