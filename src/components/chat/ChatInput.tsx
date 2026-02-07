"use client";

import { FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    disabled: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const canSubmit = value.trim().length > 0 && !disabled;

    useEffect(() => {
        inputRef.current?.focus();
    }, [disabled]);

    return (
        <div className="p-6 bg-gradient-to-t from-slate-50 to-white border-t border-slate-100">
            <form onSubmit={onSubmit} className="relative max-w-4xl mx-auto">
                <div className="relative flex items-center gap-3 p-2 bg-white border-2 border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 focus-within:border-purple-400 focus-within:shadow-purple-200/30 transition-all duration-300">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Message Rudra AI..."
                        className="flex-1 px-4 py-3 bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none text-sm"
                        disabled={disabled}
                    />

                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        size="icon"
                        className={`h-11 w-11 rounded-xl transition-all duration-300 ${canSubmit
                            ? "bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                            : "bg-slate-200 text-slate-400"
                            }`}
                    >
                        {disabled ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-3">
                    Rudra AI can make mistakes. Verify important information.
                </p>
            </form>
        </div>
    );
}
