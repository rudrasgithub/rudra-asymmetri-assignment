import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { weatherTool, stockTool, f1Tool } from "@/app/ai-tools";

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
    const { messages } = await request.json();

    const result = streamText({
        model: google("gemini-2.5-flash"),
        system: "You are a helpful assistant. You can check weather, stock prices, and F1 race info using your tools. Always use the appropriate tool when asked about weather, stocks, or F1. Be friendly and concise.",
        messages,
        tools: {
            getWeather: weatherTool,
            getStockPrice: stockTool,
            getF1Race: f1Tool,
        },
    });

    // Use data stream for proper tool invocation streaming
    // This enables the 0:, 9:, a: prefixes for text, tool calls, and tool results
    return result.toUIMessageStreamResponse();
}
