/** Represents the execution state of a tool call */
export type ToolState = "pending" | "result";

/** Represents a role in the chat conversation */
export type MessageRole = "user" | "assistant";

/** Tool invocation with its execution state and result */
export interface ToolInvocation {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: ToolState;
    result?: Record<string, unknown>;
}

/** Single message in a chat conversation */
export interface ChatMessage {
    id: string;
    role: MessageRole;
    content: string;
    toolInvocations?: ToolInvocation[];
}

/** Sidebar conversation item */
export interface Conversation {
    id: string;
    title: string;
}

/** Props for the main chat interface component */
export interface ChatInterfaceProps {
    userName: string;
    initialChatId: string;
    history: Conversation[];
    initialMessages?: ChatMessage[];
}

/** Next.js page props with search parameters */
export interface PageProps {
    searchParams: Promise<{ id?: string }>;
}

/** Weather API response data */
export interface WeatherData {
    location?: string;
    temperature?: number;
    condition?: string;
    humidity?: number;
    wind?: number;
    error?: string;
}

/** Stock market API response data */
export interface StockData {
    symbol?: string;
    price?: string;
    change?: string;
    changePercent?: string;
    error?: string;
}

/** F1 race schedule API response data */
export interface RaceData {
    raceName?: string;
    circuit?: string;
    location?: string;
    country?: string;
    date?: string;
    time?: string;
    round?: string;
    error?: string;
}
