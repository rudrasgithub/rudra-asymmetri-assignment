"use server";

import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/config/authHandler";

/** Create a new chat conversation for the authenticated user */
export async function initializeConversation(title: string = "Untitled Chat") {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const [chat] = await db.insert(chats).values({
            userId: session.user.id,
            title,
        }).returning({ id: chats.id });

        return chat?.id ?? null;
    } catch (err) {
        console.error("Failed to create conversation:", err);
        return null;
    }
}

/** Fetch all conversations for the current user (sidebar display) */
export async function fetchUserConversations() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await db
            .select({ id: chats.id, title: chats.title })
            .from(chats)
            .where(eq(chats.userId, session.user.id))
            .orderBy(desc(chats.createdAt));
    } catch (err) {
        console.error("Failed to fetch conversations:", err);
        return [];
    }
}

/** Load all messages for a specific conversation */
export async function loadConversationMessages(chatId: string) {
    try {
        return await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, chatId))
            .orderBy(messages.createdAt);
    } catch (err) {
        console.error("Failed to load messages:", err);
        return [];
    }
}

/** Update conversation title */
export async function modifyConversationTitle(chatId: string, title: string) {
    try {
        await db.update(chats).set({ title }).where(eq(chats.id, chatId));
        return { ok: true };
    } catch (err) {
        console.error("Failed to update title:", err);
        return { ok: false, message: "Could not update title" };
    }
}

/** Save a message to the database */
export async function persistMessage(
    chatId: string,
    role: "user" | "assistant",
    content: string,
    toolData?: unknown
) {
    try {
        await db.insert(messages).values({
            chatId,
            role,
            content,
            toolInvocations: toolData ?? null,
        });
        return { ok: true };
    } catch (err) {
        console.error("Failed to save message:", err);
        return { ok: false };
    }
}
