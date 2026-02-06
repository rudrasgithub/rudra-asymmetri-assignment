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
                // Text content prefix
                if (line.startsWith("0:")) {
                    try {
                        const parsed = JSON.parse(line.slice(2));
                        textAccumulator += parsed;
                        updateLastMessage({ content: textAccumulator });
                    } catch { }
                }
                // Tool call initiation prefix
                else if (line.startsWith("9:")) {
                    try {
                        const toolInfo = JSON.parse(line.slice(2));
                        if (toolInfo.toolCallId) {
                            const newTool: ToolInvocation = {
                                toolCallId: toolInfo.toolCallId,
                                toolName: toolInfo.toolName,
                                args: toolInfo.args || {},
                                state: "pending",
                            };
                            toolTracker = [...toolTracker, newTool];
                            updateLastMessage({ toolInvocations: toolTracker });
                        }
                    } catch { }
                }
                // Tool result prefix
                else if (line.startsWith("a:")) {
                    try {
                        const resultInfo = JSON.parse(line.slice(2));
                        if (resultInfo.toolCallId) {
                            toolTracker = toolTracker.map(t =>
                                t.toolCallId === resultInfo.toolCallId
                                    ? { ...t, result: resultInfo.result, state: "result" as const }
                                    : t
                            );
                            updateLastMessage({ toolInvocations: toolTracker });
                        }
                    } catch { }
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
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar Component */}
            <ChatSidebar
                currentUser={userName}
                activeId={initialChatId}
                conversations={history}
            />

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full bg-white shadow-xl h-full">
                {/* Error Banner */}
                {apiError && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-200">
                        Error: {apiError.message}
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
