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

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        if (!prompt.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: prompt,
            sender: "user",
        };
        setChatMessages([...chatMessages, userMsg]);
        setPrompt("");

        // TODO: Send to API and get response
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }

    // Switch to a different chat
    function openChat(id: string) {
        router.push(`/?id=${id}`);
    }

    // Start a new chat
    function startNewChat() {
        router.push("/");
    }

    // Handle sign out
    async function handleSignOut() {
        await signOut();
    }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Left Sidebar */}
            <aside className="w-72 bg-slate-800 text-white flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-emerald-400">Rudra AI</h2>
                    <p className="text-xs text-slate-400 mt-1">Your personal assistant</p>
                </div>

                {/* New Chat Button */}
                <div className="p-4">
                    <button
                        onClick={startNewChat}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
                    >
                        + New Conversation
                    </button>
                </div>

                {/* Chat History */}
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

                {/* User Section */}
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
                {/* Chat Header */}
                <div className="px-6 py-4 bg-white border-b">
                    <h1 className="text-lg font-semibold text-slate-800">Chat</h1>
                </div>

                {/* Messages */}
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

                {/* Input Area */}
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