import { auth } from "@/config/authHandler";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import {
  initializeConversation,
  fetchUserConversations,
  loadConversationMessages
} from "@/app/actions";
import { CMessage, PageProps } from "@/types";

export default async function HomePage({ searchParams }: PageProps) {
  // Verify user authentication
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Extract conversation ID from URL params
  const urlParams = await searchParams;
  let activeConversationId = urlParams.id;
  let conversationMessages: CMessage[] = [];

  // No ID provided - start fresh conversation
  if (!activeConversationId) {
    const freshConversationId = await initializeConversation("New Chat");
    if (freshConversationId) {
      redirect(`/?id=${freshConversationId}`);
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Failed to start conversation. Please refresh.</p>
      </div>
    );
  }

  // ID exists - hydrate with existing messages
  const storedMessages = await loadConversationMessages(activeConversationId);

  conversationMessages = storedMessages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content ?? "",
    toolInvocations: (msg.toolInvocations as CMessage["toolInvocations"]) ?? undefined,
  }));

  // Fetch sidebar data
  const conversationHistory = await fetchUserConversations();

  return (
    <ChatInterface
      key={activeConversationId}
      userName={session.user.name ?? "Guest"}
      initialChatId={activeConversationId}
      history={conversationHistory}
      initialMessages={conversationMessages}
    />
  );
}