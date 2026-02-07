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

        // Verify chat ownership
        const [chat] = await db.select().from(chats)
            .where(and(eq(chats.id, chatId), eq(chats.userId, session.user.id)))
            .limit(1);

        if (!chat) {
            return new Response("Chat not found", { status: 404 });
        }

        // Persist user message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "user") {
            await db.insert(messagesTable).values({
                chatId,
                role: "user",
                content: lastMessage.content,
            });
        }

        const result = streamText({
            model: google("gemini-2.5-flash"),
            system: "You are Rudra AI, a helpful assistant. You can check weather, stock prices, and F1 race info using your tools. Always use the appropriate tool when asked about weather, stocks, or F1. Be friendly and concise.",
            messages,
            tools: {
                getWeather: weatherTool,
                getStockPrice: stockTool,
                getF1Race: f1Tool,
            },
            stopWhen: stepCountIs(5),

            onFinish: async ({ text, steps }) => {
                let toolResults: unknown[] | null = null;

                // Collect successful tool results from all steps
                if (steps?.length) {
                    const collected: unknown[] = [];

                    for (const step of steps) {
                        if (step.toolResults) {
                            for (const tr of step.toolResults) {
                                collected.push({
                                    toolCallId: tr.toolCallId,
                                    toolName: tr.toolName,
                                    result: tr.output,
                                });
                            }
                        }
                    }

                    // Filter out failed tool calls
                    toolResults = collected.filter((item: unknown) => {
                        const tool = item as { toolName: string; result: Record<string, unknown> };
                        const res = tool.result;
                        if (!res) return false;

                        if (tool.toolName === "getWeather" && res.condition === "Unknown Location") return false;
                        if (tool.toolName === "getStockPrice" && (res.price === 0 || res.price === "0")) return false;
                        if (tool.toolName === "getF1Race" && res.raceName === "Unknown Race") return false;

                        return true;
                    });
                }

                const hasText = text?.trim().length > 0;
                const hasTools = toolResults && toolResults.length > 0;

                if (hasText || hasTools) {
                    try {
                        await db.insert(messagesTable).values({
                            chatId,
                            role: "assistant",
                            content: text || "",
                            toolInvocations: toolResults,
                        });
                    } catch (err) {
                        console.error("Failed to save assistant message:", err);
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
