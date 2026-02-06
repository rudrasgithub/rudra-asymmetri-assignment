"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type ChatProps = {
    userName: string;
    chatId: string;
    previousChats: { id: string; title: string }[];
};

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
};

export default function ChatBox({ userName, chatId, previousChats }: ChatProps) {
    const router = useRouter();

    const [prompt, setPrompt] = useState("");
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!prompt.trim() || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: prompt,
            sender: "user",
        };

        const updatedMessages = [...chatMessages, userMsg];
        setChatMessages(updatedMessages);
        setPrompt("");
        setLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: updatedMessages.map((m) => ({
                        role: m.sender === "user" ? "user" : "assistant",
                        content: m.text,
                    })),
                }),
            });

            if (!response.ok) throw new Error("API error");

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let botReply = "";

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "",
                sender: "bot",
            };
            setChatMessages([...updatedMessages, botMsg]);

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n").filter((line) => line.trim());

                for (const line of lines) {
                    if (line.startsWith("0:")) {
                        try {
                            const text = JSON.parse(line.slice(2));
                            botReply += text;
                            setChatMessages((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    ...updated[updated.length - 1],
                                    text: botReply,
                                };
                                return updated;
                            });
                        } catch { }
                    }
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, something went wrong. Please try again.",
                sender: "bot",
            };
            setChatMessages([...updatedMessages, errorMsg]);
        } finally {
            setLoading(false);
        }
    }

    function openChat(id: string) {
        router.push(`/?id=${id}`);
    }

    function startNewChat() {
        router.push("/");
    }

    async function handleSignOut() {
        await signOut();
    }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Left Sidebar */}
            <aside className="w-72 bg-slate-800 text-white flex flex-col">
                <div className="p-5 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-emerald-400">Rudra AI</h2>
                    <p className="text-xs text-slate-400 mt-1">Your personal assistant</p>
                </div>

                <div className="p-4">
                    <button
                        onClick={startNewChat}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                    >
                        + New Conversation
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-2">
                        Chat History
                    </p>
                    <div className="space-y-1">
                        {previousChats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => openChat(chat.id)}
                                className={`w-full py-2.5 px-3 rounded-lg text-left text-sm truncate transition-colors ${chat.id === chatId
                                        ? "bg-slate-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700/50"
                                    }`}
                            >
                                {chat.title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-medium">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{userName}</p>
                            <p className="text-xs text-slate-400">Online</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full bg-red-600 hover:bg-red-500 text-white border-none"
                    >
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col">
                <div className="px-6 py-4 bg-white border-b">
                    <h1 className="text-lg font-semibold text-slate-800">Chat</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {chatMessages.length === 0 ? (
                        <div className="text-center text-slate-400 mt-24">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-2xl">💬</span>
                            </div>
                            <p className="text-xl font-medium text-slate-600 mb-2">Welcome!</p>
                            <p className="text-sm">Ask me about weather, stocks, or F1 races.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-3xl mx-auto">
                            {chatMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-md px-4 py-3 rounded-2xl ${msg.sender === "user"
                                                ? "bg-emerald-600 text-white rounded-br-md"
                                                : "bg-white text-slate-800 shadow-sm rounded-bl-md"
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm text-slate-500">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t">
                    <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            disabled={loading || !prompt.trim()}
                            className="px-6 bg-emerald-600 hover:bg-emerald-500"
                        >
                            Send
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}