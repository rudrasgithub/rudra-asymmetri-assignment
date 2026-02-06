import { auth } from "@/config/authHandler";
import { redirect } from "next/navigation";
import ChatBox from "@/components/chat/ChatBox";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function Home({ searchParams }: Props) {
  // check authentication
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // get current chat id from url
  const params = await searchParams;
  const currentId = params.id || "new";

  // sample chat list - will fetch from db later
  const chatList = [
    { id: "1", title: "Weather check" },
    { id: "2", title: "Stock prices" },
    { id: "3", title: "Stock prices" },
    { id: "4", title: "Stock prices" },
    { id: "5", title: "Stock prices" },
    { id: "6", title: "Stock prices" },
    { id: "7", title: "Stock prices" },
    { id: "8", title: "Stock prices" },
    { id: "9", title: "Stock prices" },
    { id: "10", title: "Stock prices" },
    { id: "11", title: "Stock prices" },
    { id: "12", title: "Stock prices" },
    { id: "13", title: "Stock prices" },
    { id: "14", title: "Stock prices" },
    { id: "15", title: "Stock prices" },
    { id: "16", title: "Stock prices" },
    { id: "17", title: "Stock prices" },
  ];

  return (
    <ChatBox
      userName={session.user.name || "User"}
      chatId={currentId}
      previousChats={chatList}
    />
  );
}