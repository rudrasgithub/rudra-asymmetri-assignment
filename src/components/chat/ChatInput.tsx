"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
    disabled: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
    const canSubmit = value.trim().length > 0 && !disabled;

    return (
        <div className="p-4 border-t bg-white">
            <form onSubmit={onSubmit} className="flex gap-3">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={disabled}
                />
                <Button
                    type="submit"
                    disabled={!canSubmit}
                    size="icon"
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    {disabled ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
    );
}
