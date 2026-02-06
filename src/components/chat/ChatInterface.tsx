"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import { ChatInterfaceProps, CMessage, ToolInvocation } from "@/types";
import { modifyConversationTitle } from "@/app/actions";

export default function ChatInterface({
    userName,
    initialChatId,
    history,
    initialMessages = [],
}: ChatInterfaceProps) {
    const router = useRouter();

    // State management
    const [messageHistory, setMessageHistory] = useState<CMessage[]>(initialMessages);
    const [userInput, setUserInput] = useState("");
    const [processing, setProcessing] = useState(false);
    const [apiError, setApiError] = useState<Error | null>(null);
    const [titleUpdated, setTitleUpdated] = useState(initialMessages.length > 0);

    // Update conversation title from first message
    useEffect(() => {
        async function syncTitle() {
            if (titleUpdated || messageHistory.length === 0) return;

            const firstMsg = messageHistory.find(m => m.role === "user");
            if (!firstMsg?.content) return;

            const newTitle = firstMsg.content.slice(0, 50) + (firstMsg.content.length > 50 ? "..." : "");
            await modifyConversationTitle(initialChatId, newTitle);
            setTitleUpdated(true);
            router.refresh();
        }
        syncTitle();
    }, [messageHistory, titleUpdated, initialChatId, router]);

    // Parse streaming response and extract data
    async function processStream(reader: ReadableStreamDefaultReader<Uint8Array>) {
        const decoder = new TextDecoder();
        let textAccumulator = "";
        let toolTracker: ToolInvocation[] = [];

        // Add placeholder for assistant response
        const botResponse: CMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            toolInvocations: [],
        };
        setMessageHistory(prev => [...prev, botResponse]);

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.trim());

            for (const line of lines) {
                // Debug: log all lines
                console.log("Stream line:", line);

                let dataContent = "";

                // Handle SSE format (data: prefix)
                if (line.startsWith("data: ")) {
                    dataContent = line.slice(6);
                    if (dataContent === "[DONE]") continue;
                }
                // Handle direct prefix format (legacy)
                else if (line.startsWith("0:") || line.startsWith("9:") || line.startsWith("a:") || line.startsWith("e:")) {
                    // Old format: 0:"text", 9:{tool}, a:{result}
                    const prefix = line.charAt(0);
                    try {
                        const content = JSON.parse(line.slice(2));
                        if (prefix === "0" && typeof content === "string") {
                            textAccumulator += content;
                            updateLastMessage({ content: textAccumulator });
                        } else if (prefix === "9" && content.toolCallId) {
                            const newTool: ToolInvocation = {
                                toolCallId: content.toolCallId,
                                toolName: content.toolName,
                                args: content.args || {},
                                state: "pending",
                            };
                            toolTracker = [...toolTracker, newTool];
                            updateLastMessage({ toolInvocations: toolTracker });
                        } else if (prefix === "a" && content.toolCallId) {
                            toolTracker = toolTracker.map(t =>
                                t.toolCallId === content.toolCallId
                                    ? { ...t, result: content.result, state: "result" as const }
                                    : t
                            );
                            updateLastMessage({ toolInvocations: toolTracker });
                        }
                    } catch { }
                    continue;
                } else {
                    continue;
                }

                // Parse SSE data content
                try {
                    const parsed = JSON.parse(dataContent);
                    console.log("Parsed SSE:", parsed);

                    // Handle text delta
                    if (parsed.type === "text-delta") {
                        textAccumulator += parsed.delta || "";
                        updateLastMessage({ content: textAccumulator });
                    }
                    // Handle tool input start (tool call begins)
                    else if (parsed.type === "tool-input-start") {
                        const newTool: ToolInvocation = {
                            toolCallId: parsed.toolCallId,
                            toolName: parsed.toolName,
                            args: {},
                            state: "pending",
                        };
                        toolTracker = [...toolTracker, newTool];
                        updateLastMessage({ toolInvocations: toolTracker });
                    }
                    // Handle tool output available (tool result ready)
                    else if (parsed.type === "tool-output-available") {
                        toolTracker = toolTracker.map(t =>
                            t.toolCallId === parsed.toolCallId
                                ? { ...t, result: parsed.output, state: "result" as const }
                                : t
                        );
                        updateLastMessage({ toolInvocations: toolTracker });
                    }
                } catch (e) {
                    console.log("Parse error:", e);
                }
            }
        }
    }

    // Helper to update the last message in history
    function updateLastMessage(updates: Partial<CMessage>) {
        setMessageHistory(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                updated[lastIdx] = { ...updated[lastIdx], ...updates };
            }
            return updated;
        });
    }

    // Handle form submission
    async function handleMessageSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const trimmed = userInput.trim();
        if (!trimmed || processing) return;

        // Add user message
        const userMsg: CMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
        };
        const updatedHistory = [...messageHistory, userMsg];
        setMessageHistory(updatedHistory);
        setUserInput("");
        setProcessing(true);
        setApiError(null);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedHistory.map(m => ({
                        role: m.role,
                        content: m.content,
                    })),
                    chatId: initialChatId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response stream available");

            await processStream(reader);
            router.refresh();
        } catch (err) {
            console.error("Chat API error:", err);
            setApiError(err instanceof Error ? err : new Error("Something went wrong"));
            // Remove the pending message on error
            setMessageHistory(prev => prev.slice(0, -1));
        } finally {
            setProcessing(false);
        }
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 overflow-hidden">
            {/* Sidebar Component */}
            <ChatSidebar
                currentUser={userName}
                activeId={initialChatId}
                conversations={history}
            />

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col w-full bg-white/80 backdrop-blur-sm border-l border-slate-100 overflow-hidden">
                {/* Error Banner */}
                {apiError && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 text-red-600 text-sm border-b border-red-100 flex items-center gap-3">
                        <div className="p-1.5 bg-red-100 rounded-full">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        {apiError.message}
                    </div>
                )}

                {/* Message List Component */}
                <MessageList messages={messageHistory} isProcessing={processing} />

                {/* Input Component */}
                <ChatInput
                    value={userInput}
                    onChange={setUserInput}
                    onSubmit={handleMessageSubmit}
                    disabled={processing}
                />
            </main>
        </div>
    );
}
