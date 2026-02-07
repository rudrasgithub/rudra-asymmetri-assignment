"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import { ChatInterfaceProps, ChatMessage, ToolInvocation } from "@/types";
import { modifyConversationTitle } from "@/app/actions";

export default function ChatInterface({
    userName,
    initialChatId,
    history,
    initialMessages = [],
}: ChatInterfaceProps) {
    const router = useRouter();

    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [titleSynced, setTitleSynced] = useState(initialMessages.length > 0);

    // Sync conversation title with first user message
    useEffect(() => {
        if (titleSynced || messages.length === 0) return;

        const firstUserMsg = messages.find(m => m.role === "user");
        if (!firstUserMsg?.content) return;

        const title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "");
        modifyConversationTitle(initialChatId, title).then(() => {
            setTitleSynced(true);
            router.refresh();
        });
    }, [messages, titleSynced, initialChatId, router]);

    /**
     * Process SSE stream from chat API.
     * Handles both legacy prefix format (0:, 9:, a:) and standard SSE format.
     */
    async function processStream(reader: ReadableStreamDefaultReader<Uint8Array>) {
        const decoder = new TextDecoder();
        let textBuffer = "";
        let toolCalls: ToolInvocation[] = [];

        const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            toolInvocations: [],
        };
        setMessages(prev => [...prev, assistantMsg]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.trim());

            for (const line of lines) {
                let payload = "";

                // Standard SSE format
                if (line.startsWith("data: ")) {
                    payload = line.slice(6);
                    if (payload === "[DONE]") continue;
                }
                // Legacy AI SDK prefix format
                else if (/^[09ae]:/.test(line)) {
                    const prefix = line.charAt(0);
                    try {
                        const data = JSON.parse(line.slice(2));
                        if (prefix === "0" && typeof data === "string") {
                            textBuffer += data;
                            patchLastMessage({ content: textBuffer });
                        } else if (prefix === "9" && data.toolCallId) {
                            toolCalls = [...toolCalls, {
                                toolCallId: data.toolCallId,
                                toolName: data.toolName,
                                args: data.args || {},
                                state: "pending",
                            }];
                            patchLastMessage({ toolInvocations: toolCalls });
                        } else if (prefix === "a" && data.toolCallId) {
                            toolCalls = toolCalls.map(t =>
                                t.toolCallId === data.toolCallId
                                    ? { ...t, result: data.result, state: "result" as const }
                                    : t
                            );
                            patchLastMessage({ toolInvocations: toolCalls });
                        }
                    } catch { }
                    continue;
                } else {
                    continue;
                }

                // Parse SSE payload
                try {
                    const parsed = JSON.parse(payload);

                    if (parsed.type === "text-delta") {
                        textBuffer += parsed.delta || "";
                        patchLastMessage({ content: textBuffer });
                    } else if (parsed.type === "tool-input-start") {
                        toolCalls = [...toolCalls, {
                            toolCallId: parsed.toolCallId,
                            toolName: parsed.toolName,
                            args: {},
                            state: "pending",
                        }];
                        patchLastMessage({ toolInvocations: toolCalls });
                    } else if (parsed.type === "tool-output-available") {
                        toolCalls = toolCalls.map(t =>
                            t.toolCallId === parsed.toolCallId
                                ? { ...t, result: parsed.output, state: "result" as const }
                                : t
                        );
                        patchLastMessage({ toolInvocations: toolCalls });
                    }
                } catch { }
            }
        }
    }

    /** Update the last assistant message with partial data */
    function patchLastMessage(patch: Partial<ChatMessage>) {
        setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
                updated[updated.length - 1] = { ...last, ...patch };
            }
            return updated;
        });
    }

    /** Submit a message to the chat API */
    async function sendMessage(content: string) {
        const text = content.trim();
        if (!text || isLoading) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
        };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                    chatId: initialChatId,
                }),
            });

            if (!res.ok) throw new Error(`Request failed: ${res.status}`);

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No stream available");

            await processStream(reader);
            router.refresh();
        } catch (err) {
            console.error("Chat error:", err);
            setError(err instanceof Error ? err : new Error("Something went wrong"));
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    }

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        sendMessage(input);
    }

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden">
            <ChatSidebar
                currentUser={userName}
                activeId={initialChatId}
                conversations={history}
            />

            <main className="flex-1 flex flex-col w-full border-l border-slate-200 overflow-hidden">
                {error && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 text-sm border-b border-red-100 flex items-center gap-3">
                        <div className="p-1.5 bg-red-100 rounded-full">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        {error.message}
                    </div>
                )}

                <MessageList
                    messages={messages}
                    isProcessing={isLoading}
                    onSuggestionClick={sendMessage}
                />

                <ChatInput
                    value={input}
                    onChange={setInput}
                    onSubmit={handleSubmit}
                    disabled={isLoading}
                />
            </main>
        </div>
    );
}
