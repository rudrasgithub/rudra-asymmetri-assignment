// Chat Message & Tool Types
export interface ToolInvocation {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    state: "pending" | "result";
    result?: Record<string, unknown>;
}

export interface CMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    toolInvocations?: ToolInvocation[];
}

// Chat Sidebar Item
export interface ChatHistoryItem {
    id: string;
    title: string;
}

// Props for Chat Component
export interface ChatInterfaceProps {
    userName: string;
    initialChatId: string;
    history: ChatHistoryItem[];
    initialMessages?: CMessage[];
}

// Page Props with Search Params
export interface PageProps {
    searchParams: Promise<{ id?: string }>;
}

// Tool Response Types
export interface WeatherData {
    location?: string;
    temperature?: number;
    condition?: string;
    humidity?: number;
    wind?: number;
    error?: string;
}

export interface StockData {
    symbol?: string;
    price?: string;
    change?: string;
    changePercent?: string;
    error?: string;
}

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
