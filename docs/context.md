Crucial: everything is mobile first



Hasala: Comprehensive Project Master Context

1. Product Vision & Philosophy

Hasala (حصالة) is not just an expense tracker; it is a financial wellness platform designed to shift the identity of Egyptian university students and young professionals from "financially chaotic" to "financially capable."

1.1 The Core Insight

The target demographic suffers from "End of Month Panic." They do not lack money management skills because they are incapable, but because existing tools impose too much friction.

The Friction Problem: Opening an app, selecting a category, typing a description, and entering a date is too slow for a student buying a 50 EGP coffee.

The Solution: "Two-Tap" Frictionless Entry. The primary KPI for the app's success is the speed of logging a transaction. If it takes more than 5 seconds, the user will abandon the habit.

1.2 Localized Context (The "Moat")

Hasala is built specifically for the Egyptian Cash Economy.

It understands local concepts: "Koshary," "Microbus," "Fawry," "Instapay," "Jam'iya" (ROSCA).

It handles the duality of cash vs. digital spending that Western apps (Mint, YNAB) fail to model correctly for this region.

Voice-First: It prioritizes Egyptian Arabic voice input because typing in Arabic/Franco on the go is a friction point.

2. Business Model & Strategy

The business model is designed around Technical Constraints as Value Drivers.

2.1 Freemium Architecture

Free Tier (The Hook):

Unlimited manual and voice transaction logging.

Standard AI Categorization (Food, Transport, etc.).

Basic Dashboard (Monthly spend, Balance).

Technical Note: Free users utilize a Shared System Prompt. This maximizes cache hit rates on the LLM API, keeping inference costs near zero ($0.003/transaction).

Premium Tier (60 EGP/mo - The "Pro" Identity):

Custom Categories: Users can define their own buckets (e.g., "Gaming," "Skincare").

Technical Justification: Custom categories require a unique System Prompt per user, breaking the cache and increasing token costs. This cost is passed to the user.

Unlimited AI Coach: Full conversational access to the financial assistant.

Family/Partner Sync: Collaborative views for household coordination.

Recurring Expense Automation: "Set and forget" logic for fixed monthly costs.

2.2 Referral Ecosystem (Ethical Monetization)

The Mechanism: The AI analyzes spending patterns to detect "Financial Readiness."

Example: "You have consistently saved 500 EGP/month. A [Bank Name] Youth Savings Account offers 12% interest. Interested?"

The Value: Hasala generates high-quality, financially literate leads for banks (CIB, Banque Misr) and fintechs (Telda, Valu), monetizing via referral fees rather than selling user data.

3. Technical Architecture

3.1 The Tech Stack (MERN + GenAI)

Frontend: React (Vite + TypeScript). Optimized for mobile web (PWA-ready).

Styling: Tailwind CSS.

State Management: React Query / Context API.

Backend: Node.js + Express.

Role: Secure API gateway, Auth handler, AI orchestration.

Database: MongoDB (Mongoose).

Role: Flexible document storage for complex transaction metadata and chat history.

AI Core: Gemini 2.5 Flash-Lite.

Why: Best price-performance ratio for structured JSON output.

3.2 Data Models (Key Schemas)

User: Auth profile, settings (currency, language), premium status.

Transaction:

userId: Ref to User.

amount: Number.

description: String (Original input).

category: Enum (Standard) or String (Custom).

isVoiceEntry: Boolean (For analytics).

tags: Array (For granular sorting).

ChatMessage:

role: 'user' | 'ai'.

content: String (Text).

toolCalls: Array (The "Generative UI" instructions).

widgetSnapshot: Object (The frozen data payload for historical integrity).

RecurringExpense:

triggerDay: Number (1-31).

lastInjected: Date.

4. Core Feature Implementation

4.1 Smart Transaction Logging (The Engine)

Goal: Convert unstructured noise ("Paid 50 for uber") into structured data.

The Hybrid Pipeline (Cost Optimization):

Input: User speaks or types.

Layer 1: Client-Side Regex (Future): Checks for common patterns (e.g., "Uber [digits]") to categorize instantly without API calls.

Layer 2: AI Parsing (Gemini): If Regex fails, sends to backend.

Constraint: Uses JSON Schema to force the LLM to return a valid Transaction object. No "hallucinated" fields allowed.

Layer 3: Database: Saves the clean object.

4.2 AI Financial Coach (Generative UI)

Goal: A chat interface that shows rather than just tells.

Architecture: Client-Side Tool Rendering (GenUI)

The backend does NOT render HTML. It returns a Tool Call (JSON).

Example Response:

{
  "text": "Your food spending is high this week.",
  "toolCalls": [{ "name": "renderSpendingChart", "args": { "category": "Food" } }]
}


The Frontend intercepts this toolCall and renders a React Component (<SpendingChart />) directly in the chat bubble.

Context Injection:

Before every chat, the backend fetches the user's recent transaction summary (e.g., "Total Spent: 2000, Budget: 3000") and injects it into the System Prompt. This gives the AI "Memory."

Historical Snapshotting:

To ensure chat history remains truthful, the data used to generate the chart is saved in the ChatMessage document. If the user looks at this chat in 2 years, they see the chart as it was then.

4.3 Family Sync (Coordination Pivot)

Goal: Solve the "Guardian" use case without being "Spyware."

Philosophy: "Coordination, not Surveillance."

Mechanism:

Users create a FamilyGroup.

Members set Privacy Scopes: "Share Total Balance only" vs. "Share Transaction Details."

Use Case: A student shares their "Education" and "Transport" spending with their father (the financier) but keeps "Personal" spending private. This builds trust and ensures adoption.

4.4 Fixed Monthly Costs (Lazy Injection)

Goal: Automate recurring expenses without expensive cron jobs.

Mechanism:

User sets "Rent: 2000 EGP on the 1st."

The system does not run a server timer.

Trigger: When the user opens the app (or calls any API), middleware checks: if (currentDate > nextDueDate).

Action: If true, it injects the transaction retroactively and updates the nextDueDate.

Benefit: Zero "wasted" compute on inactive users.

5. Developmental Roadmap Strategy

Phase 1: The Foundation (Milestone 1)

Build the Express API skeleton.

Implement POST /chat and POST /transaction.

Set up Mongoose Schemas.

Crucial: Establish the JWT Auth flow (HttpOnly cookies) to ensure security from Day 1.

Phase 2: The Experience (Milestone 2)

Build the React Frontend.

Implement the "Unified Chat Bubble" component (Text + Widget).

Connect the useExpenses hook to the AddTransaction flow (initially local state for speed/demo).

Phase 3: The Integration (Milestone 3)

Swap local hooks for Axios API calls.

Enable the "Lazy Injection" middleware.

Finalize the "Hybrid" categorization logic.

6. Why This Will Win

Identity: It feels like a "Pro" tool, not a homework assignment.

Speed: It respects the user's time via AI parsing.

Trust: It respects user privacy via Granular Family Sharing.

Sustainability: It respects unit economics via Caching-driven pricing tiers.






Summary and more concise extra context for further understanding:
Hasala: Project Master Context

1. Project Genesis & Philosophy

Hasala is a personal finance platform built specifically for the Egyptian market, targeting university students and young professionals.

The Core Problem

The target demographic suffers from "End of Month" panic—a lack of expense visibility caused by the high friction of manual tracking. Traditional apps fail because they feel like data entry chores.

The Product Philosophy

Identity Over Utility: The app is positioned not just as a tool, but as an identity shifter. Using Hasala signals financial maturity and control.

Frictionless Entry: The primary KPI is the speed of logging an expense. Every interaction must be minimized to "two taps" or a single voice command.

Localized Intelligence: The system is built to understand the specific context of the Egyptian cash economy (e.g., "Koshary," "Microbus," "Fawry," "Instapay").

2. Business & Revenue Model

The business model leverages technical constraints to create value tiers.

Primary: Freemium Subscription

Free Tier:

Unlimited manual/voice tracking.

Basic AI categorization (using shared/cached system prompts).

Limited AI Chat interactions (e.g., 3 messages/month).

Premium Tier (60 EGP/mo):

Custom Categories: Users define their own spending buckets. Technical justification: Custom categories break the system prompt cache, increasing inference costs, thus requiring a premium subscription.

Unlimited AI Coach: Full access to the conversational agent.

Family Sync: Collaborative views for household/partner coordination.

Advanced Analytics: Deeper insights into spending habits.

Secondary: Referral Partnerships

Contextual Recommendations: The AI identifies financial readiness (e.g., "You have saved 1000 EGP consistently") and suggests relevant financial products (Student bank accounts, High-yield savings, Payment cards like Telda).

Monetization: Referral fees from banking partners (CIB, Banque Misr, etc.) for high-quality, financially literate leads.

3. Technical Architecture

Stack

Frontend: React (Vite + TypeScript). Mobile-first web application.

Backend: Node.js + Express.

Database: MongoDB (Mongoose).

AI Model: Gemini 2.5 Flash-Lite (chosen for lowest cost-per-token ratio for structured output).

Core Data Models

User: Standard auth profile + settings (currency, language).

Transaction: The atomic unit. Contains amount, description, category, type, date, and isVoiceEntry.

Budget: Category-specific spending limits.

FamilyGroup: A graph of users with specific view/edit permissions.

ChatMessage: Stores text history AND "Tool Snapshots" (see Section 4.2).

RecurringExpense: Logic for auto-injection of fixed costs.

4. Core Features & Implementation Strategy

4.1 Smart Transaction Logging (The Engine)

The critical path for user adoption. It must be faster than typing a note.

Input Methods:

Voice: Uses Browser Web Speech API (low latency, free) to capture Egyptian Arabic.

Text: Natural language input (e.g., "Paid 50 for uber").

Processing Pipeline:

Input: Raw text/audio.

AI Parsing: Sent to Gemini 2.5 Flash-Lite with a strict JSON Schema. This enforces the return of a valid Transaction object (amount, category, etc.).

Optimization (The Hybrid Model):

Phase 1 (MVP): 100% AI processing.

Phase 2 (Scale): Client-side Regex captures common patterns (e.g., "Uber [amount]") to bypass the API, reducing costs by ~60%.

Schema Validation: The AI is restricted to a predefined Enum of categories to ensure data consistency.

4.2 AI Financial Coach (Generative UI)

A chat interface that moves beyond text to visual interaction.

Context Injection: The system prompt is dynamically hydrated with a "Financial Snapshot" (Recent transactions, Budget status, Monthly burn rate). This allows the AI to answer "Can I afford this?" instantly.

Architecture: Client-Side Tool Rendering.

The Flow:

User asks a question.

AI determines a visualization is needed and generates a Tool Call (e.g., renderSpendingChart).

Frontend Interception: The React client detects the tool call and renders a dedicated Component (Widget) directly in the chat stream instead of text.

Benefits: Seamless UI, native interactivity, zero latency.

Historical Integrity (The Snapshot Pattern):

To preserve the truth of historical chats, the specific data payload used to generate a chart is serialized and saved in the ChatMessage document in MongoDB.

Result: Scrolling back 2 years shows the chart as it looked then, not as the data exists now.

4.3 Family Sync (Coordination)

Pivoted from "Parental Surveillance" to "Household Coordination."

Logic: Users create a FamilyGroup.

Privacy: Permissions are granular. A student can share their "Transport" and "Education" categories with a parent while keeping "Entertainment" private.

Implementation: A filtered aggregation query on the backend returns only the shared transaction categories to the viewer.

4.4 Fixed Monthly Costs (Auto-Injection)

Automating the "boring" part of finance.

Logic: Users define recurring expenses (Rent, Netflix).

Execution (Lazy Injection): Instead of a heavy cron job, the system checks for due recurring expenses whenever the user logs in or requests their dashboard. If the current date > next due date, the system creates the transaction and updates the next due date.

4.5 Splitwise Feature (Group Expenses)

A standalone module for managing shared expenses, inspired by Splitwise.

Goal: Allow users to track debts and shared bills without polluting their personal analytics.

Key Features:
- **Isolation**: Group expenses are stored in separate collections (`SplitGroup`, `GroupExpense`) and do not affect the user's main transaction history or budget.
- **Split Methods**: Supports Equal (with penny allocation), Exact amounts, and Percentage splits.
- **Debt Simplification**: Uses a greedy algorithm to minimize the number of transactions needed to settle up (e.g., A owes B, B owes C -> A pays C).
- **Settlement**: Dedicated "Settle Up" flow that records a payment transaction to zero out debts.

5. Why This Approach?

Cost Control: By forcing structured JSON outputs and using Flash-Lite, we minimize token usage. By gating custom prompts (categories) behind Premium, we protect margins.

User Trust: By keeping logic transparent (Standard Categories) and Family View opt-in, we avoid the "spyware" feel of competitor apps.

Scalability: The architecture decouples the intelligence (AI) from the execution (Tool Rendering), allowing the frontend to evolve independently of the model capability.