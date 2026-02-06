"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Plus, MessageSquare, Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatHistoryItem } from "@/types";

interface SidebarProps {
    currentUser: string;
    activeId: string;
    conversations: ChatHistoryItem[];
}

export default function ChatSidebar({ currentUser, activeId, conversations }: SidebarProps) {
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);

    const navigateToChat = (chatId: string) => {
        router.push(`/?id=${chatId}`);
    };

    const startFreshChat = () => {
        router.push("/");
    };

    const handleLogout = async () => {
        setSigningOut(true);
        await signOut();
    };

    return (
        <aside className="w-64 bg-white border-r hidden md:flex flex-col p-4 justify-between">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-6">
                    <Bot className="h-6 w-6 text-purple-600" />
                    <h1 className="font-bold text-xl">Rudra AI</h1>
                </div>

                {/* New Chat Button */}
                <Button
                    variant="outline"
                    className="w-full mb-4 justify-start gap-2 border-dashed"
                    onClick={startFreshChat}
                >
                    <Plus className="h-4 w-4" />
                    Start New Chat
                </Button>

                {/* Conversation List */}
                <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        Previous Chats
                    </p>
                    <ScrollArea className="h-[300px]">
                        {conversations.map((item) => (
                            <Button
                                key={item.id}
                                variant={item.id === activeId ? "secondary" : "ghost"}
                                className="w-full justify-start text-sm truncate px-2 mb-1"
                                onClick={() => navigateToChat(item.id)}
                            >
                                <MessageSquare className="h-4 w-4 mr-2 opacity-70 flex-shrink-0" />
                                <span className="truncate w-full text-left">{item.title}</span>
                            </Button>
                        ))}
                    </ScrollArea>
                </div>
            </div>

            {/* Footer with User Info */}
            <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2 truncate">
                    Logged in as: {currentUser}
                </p>
                <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    disabled={signingOut}
                    onClick={handleLogout}
                >
                    {signingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="h-4 w-4" />
                    )}
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
