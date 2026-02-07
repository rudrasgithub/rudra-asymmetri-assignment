import { auth } from "@/config/authHandler";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import {
  initializeConversation,
  fetchUserConversations,
  loadConversationMessages
} from "@/app/actions";
import { ChatMessage, PageProps } from "@/types";

export default async function HomePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const chatId = params.id;
  let messages: ChatMessage[] = [];

  // Create new conversation if no ID provided
  if (!chatId) {
    const newId = await initializeConversation("New Chat");
    if (newId) {
      redirect(`/?id=${newId}`);
    }
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Failed to start conversation. Please refresh.</p>
      </div>
    );
  }

  // Load existing conversation messages
  const stored = await loadConversationMessages(chatId);
  messages = stored.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content ?? "",
    toolInvocations: (msg.toolInvocations as ChatMessage["toolInvocations"]) ?? undefined,
  }));

  const history = await fetchUserConversations();

  return (
    <ChatInterface
      key={chatId}
      userName={session.user.name ?? "Guest"}
      initialChatId={chatId}
      history={history}
      initialMessages={messages}
    />
  );
}