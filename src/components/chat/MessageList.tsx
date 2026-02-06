"use client";

import { useRef, useEffect } from "react";
import { Bot, User, Loader2, Sparkles } from "lucide-react";
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

    // Empty state - premium landing
    if (messages.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
                    {/* Animated logo */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl blur-2xl opacity-30 animate-pulse" />
                        <div className="relative p-5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl shadow-2xl shadow-purple-500/30">
                            <Sparkles className="h-12 w-12 text-white" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 mb-3">
                        Welcome to Rudra AI
                    </h2>
                    <p className="text-slate-500 text-center max-w-md mb-10">
                        Your intelligent assistant powered by Google Gemini. Ask me anything about weather, stocks, or Formula 1!
                    </p>

                    {/* Suggestion chips */}
                    <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                        <SuggestionChip
                            emoji="🌤️"
                            text="What's the weather in Paris?"
                            color="blue"
                        />
                        <SuggestionChip
                            emoji="📈"
                            text="NVDA stock price"
                            color="green"
                        />
                        <SuggestionChip
                            emoji="🏎️"
                            text="When's the next F1 race?"
                            color="red"
                        />
                        <SuggestionChip
                            emoji="🌡️"
                            text="Temperature in Mumbai"
                            color="orange"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6 pb-4 max-w-4xl mx-auto">
                {messages.map((msg) => {
                    // User message bubble
                    if (msg.role === "user") {
                        return (
                            <div key={msg.id} className="flex gap-4 justify-end animate-in slide-in-from-right-2 duration-300">
                                <div className="max-w-[75%] rounded-2xl rounded-tr-sm p-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/20">
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {msg.content}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-md ring-2 ring-slate-200">
                                    <User className="h-5 w-5 text-white" />
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
                        <div key={msg.id} className="flex gap-4 justify-start animate-in slide-in-from-left-2 duration-300">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20 ring-2 ring-purple-200">
                                <Bot className="h-5 w-5 text-white" />
                            </div>

                            <div className="max-w-[75%] rounded-2xl rounded-tl-sm p-4 bg-white border border-slate-200 shadow-sm">
                                {/* Fallback when all tools failed */}
                                {showFallback ? (
                                    <p className="text-sm text-slate-400 italic">
                                        Unable to fetch data at this time
                                    </p>
                                ) : textContent ? (
                                    <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                        {textContent}
                                    </p>
                                ) : null}

                                {/* Pending tools - loading indicators */}
                                {pendingTools.map((inv) => (
                                    <div key={inv.toolCallId} className="flex items-center gap-2 mt-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                                        <span className="text-xs text-slate-500">
                                            Fetching {inv.toolName.replace("get", "")} data...
                                        </span>
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
                    <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-2 ring-purple-200">
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-sm text-slate-500">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
}

// Suggestion chip component
function SuggestionChip({ emoji, text, color }: { emoji: string; text: string; color: string }) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 hover:border-blue-300",
        green: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300",
        red: "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300",
        orange: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-300",
    };

    return (
        <button className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 hover:scale-105 hover:shadow-md ${colorClasses[color]}`}>
            <span>{emoji}</span>
            <span>{text}</span>
        </button>
    );
}
