# Chat Persistence Implementation

This document details the technical implementation of the chat persistence feature in Hasala.

## 1. Architecture Overview

The chat persistence system is designed to store not just the text of the conversation, but the **contextual state** of the AI's responses, specifically the interactive widgets (charts).

**Key Components:**
- **Database**: MongoDB with `ChatThread` and `ChatMessage` collections.
- **Backend**: Node.js/Express controller (`chatController.ts`) handling logic.
- **Frontend**: React components (`ChatInterface`, `ChatHistorySidebar`) managing UI state.

## 2. Data Models

We split the data into two models to optimize for listing threads vs. loading messages.

### `ChatThread`
Stores metadata about the conversation.
- `user`: Reference to the owner.
- `title`: Auto-generated from the first message (e.g., "Budget for October...").
- `lastMessageAt`: Used for sorting the sidebar list.

### `ChatMessage`
Stores the actual content.
- `thread`: Reference to the parent thread.
- `role`: `user` or `model`.
- `text`: The text content.
- `toolCalls`: **Crucial**. Stores the array of tool calls (widgets) the AI generated.

## 3. The "Snapshot" Strategy (Critical)

A major challenge with financial chat history is that data changes. If you ask "How much did I spend?" today, and view that chat next month, a live chart would show next month's data, which is historically inaccurate.

**Solution: Server-Side Hydration**
When the AI generates a tool call (e.g., `renderBudgetOverview`), the server **injects** the current calculated data into the tool's arguments *before* saving it to the database.

**Flow:**
1.  AI suggests: `renderBudgetOverview({})`
2.  Server calculates: `totalSpent = 500`, `budget = 5000`.
3.  Server modifies tool call: `renderBudgetOverview({ totalSpent: 500, budget: 5000 })`
4.  Server saves to DB: The `ChatMessage` now contains the *data as it was at that moment*.
5.  Frontend renders: Uses the stored data directly, ignoring current live data.

## 4. Context Restoration

When continuing a conversation, we must provide the AI with context. However, simply sending past text isn't enough if the AI previously answered with *only* a chart.

**Solution: Context Synthesis**
When loading history from the DB, we synthesize text descriptions for past tool calls.

- **DB**: `[ToolCall: renderSpendingChart]`
- **Context sent to AI**: `(I showed the spending chart)`

This ensures the AI "remembers" it showed a chart, preventing it from repeating itself or losing track of the flow.

## 5. Frontend Integration

- **`ChatHistorySidebar`**: Fetches `GET /api/chat` to list threads.
- **Navigation**: Clicking a thread sets `activeThreadId`.
- **Message Loading**: Fetches `GET /api/chat/:threadId` and replaces the current message list.
- **New Chat**: Clears `activeThreadId` and resets the message list to the welcome screen.
- **Deletion**: `DELETE /api/chat/:threadId` removes the thread and all its messages.
