import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { weatherTool, stockTool, f1Tool } from "@/app/ai-tools";
import { db } from "@/db";
import { messages } from "@/db/schema";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
    const { messages: chatMessages, chatId } = await request.json();

    // Save user message to database
    const lastUserMessage = chatMessages[chatMessages.length - 1];
    if (lastUserMessage && lastUserMessage.role === "user" && chatId) {
        try {
            await db.insert(messages).values({
                chatId: chatId,
                role: "user",
                content: lastUserMessage.content,
            });
        } catch (err) {
            console.error("Failed to save user message:", err);
        }
    }

    const result = streamText({
        model: google("gemini-2.5-flash"),
        system: "You are Rudra AI, a helpful assistant. You can check weather, stock prices, and F1 race info using your tools. Always use the appropriate tool when asked about weather, stocks, or F1. Be friendly and concise.",
        messages: chatMessages,
        tools: {
            getWeather: weatherTool,
            getStockPrice: stockTool,
            getF1Race: f1Tool,
        },
        maxSteps: 5,
        onFinish: async ({ text, toolCalls, toolResults }) => {
            // Save assistant response to database
            if (chatId) {
                try {
                    // Build tool invocations array for storage
                    const toolInvocations = toolCalls?.map((call, index) => ({
                        toolCallId: call.toolCallId,
                        toolName: call.toolName,
                        args: call.args,
                        state: "result",
                        result: toolResults?.[index]?.result || null,
                    })) || null;

                    await db.insert(messages).values({
                        chatId: chatId,
                        role: "assistant",
                        content: text || "",
                        toolInvocations: toolInvocations,
                    });
                } catch (err) {
                    console.error("Failed to save assistant message:", err);
                }
            }
        },
    });

    // Use data stream response for proper tool streaming (0:, 9:, a: prefixes)
    return result.toDataStreamResponse();
}
