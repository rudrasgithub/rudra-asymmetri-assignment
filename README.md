# Rudra AI - Intelligent Chat Assistant

A modern AI-powered chat application built with Next.js 16, featuring real-time streaming responses, tool integrations, and a beautiful UI.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)

## ✨ Features

- **AI-Powered Chat** - Powered by Google Gemini 2.5 Flash with streaming responses
- **Tool Integrations**:
  - 🌤️ **Weather** - Real-time weather data via OpenWeather API
  - 📈 **Stocks** - Live stock prices via Alpha Vantage API
  - 🏎️ **F1 Racing** - Upcoming race info via Ergast API
- **Authentication** - GitHub & Google OAuth via NextAuth.js
- **Persistent Conversations** - Chat history stored in PostgreSQL via Drizzle ORM
- **Modern UI** - Responsive design with smooth animations and tool cards

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 |
| AI SDK | Vercel AI SDK |
| LLM | Google Gemini 2.5 Flash |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Supabase account)
- API keys for:
  - Google Gemini
  - OpenWeather
  - Alpha Vantage

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rudrasgithub/rudra-asymmetri-assignment.git
   cd rudra-asymmetri-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # NextAuth
   AUTH_SECRET="your-secret-key"
   AUTH_GITHUB_ID="your-github-client-id"
   AUTH_GITHUB_SECRET="your-github-client-secret"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"

   # AI & Tools
   GEMINI_API_KEY="your-gemini-api-key"
   OPENWEATHER_API_KEY="your-openweather-key"
   ALPHAVANTAGE_API_KEY="your-alphavantage-key"
   ```

4. **Run database migrations**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth API routes
│   │   └── chat/          # Chat streaming endpoint
│   ├── ai-tools/          # AI tool definitions
│   ├── login/             # Login page
│   ├── actions.ts         # Server actions
│   └── page.tsx           # Main chat page
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx   # Main chat container
│   │   ├── ChatSidebar.tsx     # Conversation sidebar
│   │   ├── MessageList.tsx     # Message rendering
│   │   ├── ChatInput.tsx       # Input form
│   │   └── tool-cards.tsx      # Weather/Stock/F1 cards
│   └── ui/                # Shadcn UI components
├── config/
│   └── authHandler.ts     # NextAuth configuration
├── db/
│   ├── index.ts           # Database connection
│   └── schema.ts          # Drizzle schema
└── types/
    └── index.ts           # TypeScript types
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit generate` | Generate migrations |
| `npx drizzle-kit migrate` | Run migrations |
| `npx drizzle-kit studio` | Open Drizzle Studio |

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Stream AI responses |
| `/api/auth/*` | * | NextAuth routes |

## 📄 License

This project is for educational/assignment purposes.

---

Built with ❤️ by [Rudra](https://github.com/rudrasgithub)
