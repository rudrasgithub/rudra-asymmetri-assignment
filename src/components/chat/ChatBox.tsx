"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { WeatherCard, StockCard, F1Card } from "@/components/chat/tool-cards";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Send,
    LogOut,
    Bot,
    User,
    Plus,
    MessageSquare,
    Loader2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatInterfaceProps, CMessage, ToolInvocation } from "@/types";
import { modifyConversationTitle } from "@/app/actions";

export default function ChatInterface({
    userName,
    initialChatId,
    history,
    initialMessages = [],
}: ChatInterfaceProps) {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [hasUpdatedTitle, setHasUpdatedTitle] = useState(initialMessages.length > 0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<CMessage[]>(initialMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Auto-update chat title from first user message
    useEffect(() => {
        const updateTitle = async () => {
            if (!hasUpdatedTitle && messages.length > 0) {
                const firstUserMessage = messages.find((m) => m.role === "user");
                if (firstUserMessage?.content) {
                    const title =
                        firstUserMessage.content.slice(0, 50) +
                        (firstUserMessage.content.length > 50 ? "..." : "");
                    await modifyConversationTitle(initialChatId, title);
                    setHasUpdatedTitle(true);
                    router.refresh();
                }
            }
        };
        updateTitle();
    }, [messages, hasUpdatedTitle, initialChatId, router]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Helper func: Check if a tool result is a failure
    const isToolFailed = (tool: ToolInvocation): boolean => {
        if (!tool.result) return false;
        const r = tool.result;

        if (tool.toolName === "getWeather" && r.condition === "Unknown Location") return true;
        if (tool.toolName === "getStockPrice" && (!r.price || r.price === 0 || r.price === "0" || r.price === "0.00")) return true;
        if (tool.toolName === "getF1Race" && (r.raceName === "Unknown Race" || r.raceName === "API Error")) return true;

        return false;
    };

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        const userMessage: CMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmedInput,
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInputValue("");
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                    chatId: initialChatId,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            if (!reader) throw new Error("No response body");

            const assistantMessage: CMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "",
                toolInvocations: [],
            };

            setMessages((prev) => [...prev, assistantMessage]);

            let fullContent = "";
            let currentToolInvocations: ToolInvocation[] = [];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter((line) => line.trim());

                for (const line of lines) {
                    // Text content
                    if (line.startsWith("0:")) {
                        try {
                            const text = JSON.parse(line.slice(2));
                            fullContent += text;
                            setMessages((prev) => {
                                const updated = [...prev];
                                const lastMsg = updated[updated.length - 1];
                                if (lastMsg?.role === "assistant") {
                                    lastMsg.content = fullContent;
                                }
                                return updated;
                            });
                        } catch {
                            // Ignore parse errors
                        }
                    }
                    // Tool call start
                    else if (line.startsWith("9:")) {
                        try {
                            const toolData = JSON.parse(line.slice(2));
                            if (toolData.toolCallId) {
                                const toolInvocation: ToolInvocation = {
                                    toolCallId: toolData.toolCallId,
                                    toolName: toolData.toolName,
                                    args: toolData.args || {},
                                    state: "pending",
                                };
                                currentToolInvocations = [...currentToolInvocations, toolInvocation];
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    const lastMsg = updated[updated.length - 1];
                                    if (lastMsg?.role === "assistant") {
                                        lastMsg.toolInvocations = currentToolInvocations;
                                    }
                                    return updated;
                                });
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                    // Tool result
                    else if (line.startsWith("a:")) {
                        try {
                            const resultData = JSON.parse(line.slice(2));
                            if (resultData.toolCallId) {
                                currentToolInvocations = currentToolInvocations.map((t) =>
                                    t.toolCallId === resultData.toolCallId
                                        ? { ...t, result: resultData.result, state: "result" as const }
                                        : t
                                );
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    const lastMsg = updated[updated.length - 1];
                                    if (lastMsg?.role === "assistant") {
                                        lastMsg.toolInvocations = currentToolInvocations;
                                    }
                                    return updated;
                                });
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }

            router.refresh();
        } catch (err) {
            console.error("Chat error:", err);
            setError(err instanceof Error ? err : new Error("An error occurred"));
            setMessages((prev) => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => router.push("/");
    const handleChatSelect = (chatId: string) => router.push(`/?id=${chatId}`);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r hidden md:flex flex-col p-4 justify-between">
                <div>
                    <h1 className="font-bold text-xl mb-6 flex items-center gap-2">
                        <Bot className="h-6 w-6 text-purple-600" /> Asymmetri AI
                    </h1>
                    <Button
                        variant="outline"
                        className="w-full mb-4 justify-start gap-2 border-dashed"
                        onClick={handleNewChat}
                    >
                        <Plus className="h-4 w-4" /> New Chat
                    </Button>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                            Recent Chats
                        </p>
                        <ScrollArea className="h-[300px]">
                            {history?.map((chat) => (
                                <Button
                                    key={chat.id}
                                    variant={chat.id === initialChatId ? "secondary" : "ghost"}
                                    className="w-full justify-start text-sm truncate px-2 mb-1"
                                    onClick={() => handleChatSelect(chat.id)}
                                >
                                    <MessageSquare className="h-4 w-4 mr-2 opacity-70 flex-shrink-0" />
                                    <span className="truncate w-full text-left">{chat.title}</span>
                                </Button>
                            ))}
                        </ScrollArea>
                    </div>
                </div>
                <div className="border-t pt-4">
                    <div className="text-sm text-gray-500 mb-2 truncate">User: {userName}</div>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        disabled={isSigningOut}
                        onClick={async () => {
                            setIsSigningOut(true);
                            await signOut();
                        }}
                    >
                        {isSigningOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="h-4 w-4" />
                        )}
                        Sign Out
                    </Button>
                </div>
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full bg-white shadow-xl h-full">
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-200">
                        Error: {error.message}
                    </div>
                )}

                <ScrollArea className="flex-1 p-4">
                    <div className="flex flex-col gap-6 pb-4">
                        {/* Empty state */}
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 mt-20">
                                <Bot className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                                <p className="text-lg font-medium">Welcome to Asymmetri AI!</p>
                                <p className="mt-2">Ask me about the weather, stock prices, or F1 races!</p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        Weather in London?
                                    </span>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                        AAPL stock price
                                    </span>
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                        Next F1 race?
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((m) => {
                            const tools = m.toolInvocations || [];
                            const hasText = m.content && m.content.trim().length > 0;

                            // Separate pending and completed tools
                            const pendingTools = tools.filter(t => !t.result);
                            const completedTools = tools.filter(t => t.result);

                            // Among completed, check which succeeded
                            const successfulTools = completedTools.filter(t => !isToolFailed(t));

                            // Determine what to show
                            const allToolsCompleted = tools.length > 0 && pendingTools.length === 0;
                            const hasSuccessfulTools = successfulTools.length > 0;
                            const allToolsFailed = allToolsCompleted && completedTools.length > 0 && successfulTools.length === 0;

                            // Show fallback ONLY if all tools completed and failed, with no text
                            const showFallback = allToolsFailed && !hasText;

                            // Don't render the bubble if there's nothing to show yet
                            const shouldRenderBubble = hasText || hasSuccessfulTools || pendingTools.length > 0 || showFallback;

                            // For user messages, always render
                            if (m.role === "user") {
                                return (
                                    <div key={m.id} className="flex gap-3 justify-end">
                                        <div className="max-w-[80%] rounded-2xl p-4 bg-black text-white rounded-tr-none">
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {m.content}
                                            </div>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            <User className="h-5 w-5 text-gray-600" />
                                        </div>
                                    </div>
                                );
                            }

                            // For assistant messages, only render if there's something to show
                            if (!shouldRenderBubble) {
                                return null;
                            }

                            return (
                                <div key={m.id} className="flex gap-3 justify-start">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200 flex-shrink-0">
                                        <Bot className="h-5 w-5 text-purple-600" />
                                    </div>

                                    <div className="max-w-[80%] rounded-2xl p-4 bg-gray-100 text-black rounded-tl-none">
                                        {/* Show fallback message if all tools failed */}
                                        {showFallback ? (
                                            <div className="text-sm text-gray-500 italic">
                                                Did not find data from Tool&apos;s API
                                            </div>
                                        ) : hasText ? (
                                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {m.content}
                                            </div>
                                        ) : null}

                                        {/* Render pending tools - loading state */}
                                        {pendingTools.map((invocation) => (
                                            <div
                                                key={invocation.toolCallId}
                                                className="text-xs text-gray-400 mt-2 flex items-center gap-2"
                                            >
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Running {invocation.toolName}...
                                            </div>
                                        ))}

                                        {/* Render completed tool cards */}
                                        {completedTools.map((invocation) => {
                                            if (invocation.toolName === "getWeather") {
                                                return <WeatherCard key={invocation.toolCallId} data={invocation.result as Record<string, unknown>} />;
                                            }
                                            if (invocation.toolName === "getStockPrice") {
                                                return <StockCard key={invocation.toolCallId} data={invocation.result as Record<string, unknown>} />;
                                            }
                                            if (invocation.toolName === "getF1Race") {
                                                return <F1Card key={invocation.toolCallId} data={invocation.result as Record<string, unknown>} />;
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Loading indicator */}
                        {isLoading && messages[messages.length - 1]?.role === "user" && (
                            <div className="flex gap-3 justify-start">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200">
                                    <Bot className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        AI is thinking...
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input form */}
                <div className="p-4 border-t bg-white">
                    <form onSubmit={onSubmit} className="flex gap-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}