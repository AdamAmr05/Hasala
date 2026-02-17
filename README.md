# Hasala

Hasala is a mobile-first personal finance app with AI-assisted logging, chat-based financial insights, and shared money features (groups + family).

This repo includes:
- `client/`: React + Vite frontend
- `server/`: Express + MongoDB API
- `presentation/`: slide deck used to demo the product (wont work for anyone because of the assets)

## What It Does

- Auth with persistent sessions (JWT in HttpOnly cookie)
- Transaction tracking (income + expenses)
- AI parsing for text and voice transaction input
- AI chat with persisted threads and tool-based UI widgets
- Analytics (totals, category split, trend, people/income breakdown)
- Recurring transactions (with lazy injection logic)
- Savings goals tracking
- Group expense splitting flows
- Family overview and invite/join flow

## Tech Stack

- Frontend: React 19, TypeScript, Vite, React Query, Tailwind
- Backend: Node.js, Express, TypeScript, Mongoose
- Database: MongoDB
- AI: Google Gemini (`@google/genai`)

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 2. Backend env

Create `server/.env` (or root `.env.local` as used by the server loader):

```bash
MONGODB_URI=mongodb://localhost:27017/hasala
JWT_SECRET=replace-with-a-strong-secret
GEMINI_API_KEY=your-gemini-api-key
# Optional
PORT=5001
ALLOWED_ORIGINS=http://localhost:5173
GEMINI_MODEL=gemini-3-flash-preview
```

### 3. Install deps

```bash
cd server && npm install
cd ../client && npm install
cd ../presentation && npm install
```

### 4. Run app

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Open `http://localhost:5173`.

### 5. Run presentation (optional)

```bash
cd presentation && npm run dev
```

## API Base URL

Client defaults:
- local: `http://localhost:5001/api`
- LAN mode (when host is `192.168.1.7`): `http://192.168.1.7:5001/api`

Override with client env vars if needed:
- `VITE_API_BASE_URL`
- `VITE_API_BASE_URL_N`


