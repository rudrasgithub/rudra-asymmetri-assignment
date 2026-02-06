"use server";

import { db } from "@/db";
import { chats, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/config/authHandler";

/**
 * Initialize a new conversation for the current user
 */
export async function initializeConversation(defaultTitle: string = "Untitled Chat") {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const [newChat] = await db.insert(chats).values({
            userId: session.user.id,
            title: defaultTitle,
        }).returning({ id: chats.id });

        return newChat?.id ?? null;
    } catch (err) {
        console.error("Conversation init failed:", err);
        return null;
    }
}

/**
 * Retrieve all conversations for sidebar display
 */
export async function fetchUserConversations() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const userChats = await db
            .select({ id: chats.id, title: chats.title })
            .from(chats)
            .where(eq(chats.userId, session.user.id))
            .orderBy(desc(chats.createdAt));

        return userChats;
    } catch (err) {
        console.error("Fetch conversations failed:", err);
        return [];
    }
}

/**
 * Load message history for a specific conversation
 */
export async function loadConversationMessages(conversationId: string) {
    try {
        const messageList = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, conversationId))
            .orderBy(messages.createdAt);

        return messageList;
    } catch (err) {
        console.error("Load messages failed:", err);
        return [];
    }
}

/**
 * Modify the title of an existing conversation
 */
export async function modifyConversationTitle(conversationId: string, newTitle: string) {
    try {
        await db.update(chats).set({ title: newTitle }).where(eq(chats.id, conversationId));
        return { ok: true };
    } catch (err) {
        console.error("Title update failed:", err);
        return { ok: false, message: "Could not update title" };
    }
}

/**
 * Persist a message to the database
 */
export async function persistMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    toolData?: unknown
) {
    try {
        await db.insert(messages).values({
            chatId: conversationId,
            role,
            content,
            toolInvocations: toolData ?? null,
        });
        return { ok: true };
    } catch (err) {
        console.error("Message persistence failed:", err);
        return { ok: false };
    }
}
