"use client";

import { useRef, useEffect } from "react";
import { Bot, User, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WeatherCard, StockCard, F1Card } from "@/components/chat/tool-cards";
import { CMessage, ToolInvocation } from "@/types";

interface MessageListProps {
    messages: CMessage[];
    isProcessing: boolean;
}

// Utility: Check if tool execution failed
function didToolFail(tool: ToolInvocation): boolean {
    if (!tool.result) return false;
    const res = tool.result;

    if (tool.toolName === "getWeather" && res.condition === "Unknown Location") return true;
    if (tool.toolName === "getStockPrice" && (!res.price || res.price === 0 || res.price === "0")) return true;
    if (tool.toolName === "getF1Race" && (res.raceName === "Unknown Race" || res.raceName === "API Error")) return true;

    return false;
}

// Render individual tool card based on type
function renderToolResult(invocation: ToolInvocation) {
    const { toolName, toolCallId, result } = invocation;

    switch (toolName) {
        case "getWeather":
            return <WeatherCard key={toolCallId} data={result as Record<string, unknown>} />;
        case "getStockPrice":
            return <StockCard key={toolCallId} data={result as Record<string, unknown>} />;
        case "getF1Race":
            return <F1Card key={toolCallId} data={result as Record<string, unknown>} />;
        default:
            return null;
    }
}

export default function MessageList({ messages, isProcessing }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll when messages update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Empty state
    if (messages.length === 0) {
        return (
            <ScrollArea className="flex-1 p-4">
                <div className="text-center text-gray-400 mt-20">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                    <p className="text-lg font-medium">Hello! I&apos;m Rudra AI</p>
                    <p className="mt-2">Try asking about weather, stocks, or F1 races!</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            Weather in Tokyo?
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            TSLA stock price
                        </span>
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                            Next F1 race?
                        </span>
                    </div>
                </div>
            </ScrollArea>
        );
    }

    return (
        <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-6 pb-4">
                {messages.map((msg) => {
                    // User message bubble
                    if (msg.role === "user") {
                        return (
                            <div key={msg.id} className="flex gap-3 justify-end">
                                <div className="max-w-[80%] rounded-2xl p-4 bg-black text-white rounded-tr-none">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <User className="h-5 w-5 text-gray-600" />
                                </div>
                            </div>
                        );
                    }

                    // Assistant message processing
                    const tools = msg.toolInvocations || [];
                    const textContent = msg.content?.trim() || "";

                    const pendingTools = tools.filter(t => !t.result);
                    const finishedTools = tools.filter(t => t.result);
                    const successfulTools = finishedTools.filter(t => !didToolFail(t));

                    const allDone = tools.length > 0 && pendingTools.length === 0;
                    const allFailed = allDone && finishedTools.length > 0 && successfulTools.length === 0;
                    const showFallback = allFailed && !textContent;

                    const hasContent = textContent || successfulTools.length > 0 || pendingTools.length > 0 || showFallback;

                    if (!hasContent) return null;

                    return (
                        <div key={msg.id} className="flex gap-3 justify-start">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200 flex-shrink-0">
                                <Bot className="h-5 w-5 text-purple-600" />
                            </div>

                            <div className="max-w-[80%] rounded-2xl p-4 bg-gray-100 text-black rounded-tl-none">
                                {/* Fallback when all tools failed */}
                                {showFallback ? (
                                    <p className="text-sm text-gray-500 italic">
                                        Could not retrieve data from the API
                                    </p>
                                ) : textContent ? (
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {textContent}
                                    </p>
                                ) : null}

                                {/* Pending tools - loading indicators */}
                                {pendingTools.map((inv) => (
                                    <div key={inv.toolCallId} className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Executing {inv.toolName}...
                                    </div>
                                ))}

                                {/* Completed tool results */}
                                {finishedTools.map(renderToolResult)}
                            </div>
                        </div>
                    );
                })}

                {/* Thinking indicator */}
                {isProcessing && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex gap-3 justify-start">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                            <Bot className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing your request...
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
