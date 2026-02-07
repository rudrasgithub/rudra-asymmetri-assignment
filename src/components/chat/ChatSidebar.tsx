"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, Loader2, LogOut, Sparkles } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Conversation } from "@/types";
import { initializeConversation } from "@/app/actions";

interface SidebarProps {
    currentUser: string;
    activeId: string;
    conversations: Conversation[];
}

export default function ChatSidebar({ currentUser, activeId, conversations }: SidebarProps) {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    function navigateTo(chatId: string) {
        router.push(`/?id=${chatId}`);
    }

    async function createNewChat() {
        const current = conversations.find(c => c.id === activeId);
        if (current?.title === "New Chat" || isCreating) return;

        setIsCreating(true);
        try {
            const id = await initializeConversation("New Chat");
            if (id) router.push(`/?id=${id}`);
        } catch (err) {
            console.error("Failed to create chat:", err);
        } finally {
            setIsCreating(false);
        }
    }

    async function handleSignOut() {
        setIsSigningOut(true);
        await signOut();
    }

    return (
        <aside className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 hidden md:flex flex-col p-5 justify-between border-r border-slate-700/50 flex-shrink-0 overflow-hidden">
            <div>
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-white tracking-tight">Rudra AI</h1>
                        <p className="text-xs text-slate-400">Powered by Gemini</p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full mb-6 justify-start gap-3 py-6 border-dashed border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all duration-300 group"
                    onClick={createNewChat}
                    disabled={isCreating}
                >
                    <div className="p-1.5 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-lg group-hover:from-violet-500/40 group-hover:to-purple-600/40 transition-all">
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    </div>
                    {isCreating ? "Creating..." : "New Conversation"}
                </Button>

                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-widest px-1">History</p>
                    <ScrollArea className="h-[320px] pr-2">
                        <div className="space-y-1">
                            {conversations.map((conv) => (
                                <Button
                                    key={conv.id}
                                    variant="ghost"
                                    className={`w-full justify-start text-sm px-3 py-5 rounded-xl transition-all duration-200 ${conv.id === activeId
                                            ? "bg-gradient-to-r from-violet-500/20 to-purple-600/20 text-white border border-purple-500/30"
                                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                                        }`}
                                    onClick={() => navigateTo(conv.id)}
                                >
                                    <MessageSquare className={`h-4 w-4 mr-3 flex-shrink-0 ${conv.id === activeId ? "text-purple-400" : "opacity-50"}`} />
                                    <span className="truncate">{conv.title}</span>
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                        {currentUser.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{currentUser}</p>
                        <p className="text-xs text-slate-500">Active</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    disabled={isSigningOut}
                    onClick={handleSignOut}
                >
                    {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
