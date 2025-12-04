Hasala: Development Roadmap

Vision: To build a High-end AI Fintech App inside the University MERN Project requirements. Strategy: Leverage the existing "Generative UI" prototype as the frontend foundation, swapping its local state for a robust Express/Mongo backend without rewriting the UI logic.

Phase 0: Foundation & Planning (Milestone 0)

Status: ✅ Complete
Goal: Define the "Trojan Horse" scope—satisfying course requirements while establishing the real product vision.

[x] Product Definition: Define the 7 Core Features (Auth, AI Logging, Chat, Dashboard, Family, Budget, Recurring).

[x] Team Architecture: Assign "Virtual" roles to cover all features (Authentication, Core AI, Dashboarding).

[x] Data Modeling: Define Mongoose Schemas for User, Transaction, Budget, FamilyGroup.

[x] Submission: Push README.md to GitHub.

Phase 1: The "Brain" (Backend Core)

Course Alignment: Milestone 1 (API Skeleton)
Real Goal: Establish the secure, AI-ready infrastructure that powers your existing frontend.

1.1 Infrastructure Setup

[ ] Repo Init: Initialize Monorepo (client/server structure) with TypeScript.

[ ] Database: Connect to MongoDB Atlas.

[ ] Environment: Secure .env handling (Gemini Keys, JWT Secrets).

1.2 Authentication System (The Gatekeeper)

[ ] User Model: Implement Schema with password hashing (bcrypt).

[ ] Auth Logic: Build POST /auth/register and POST /auth/login.

[ ] Session Management: Implement JWT generation and secure httpOnly cookie delivery.

[ ] Middleware: Create protect middleware to secure future API routes.

1.3 Core Transaction API (The Ledger)

[ ] Transaction Model: Implement Mongoose schema with Enums (Category, Type).

[ ] CRUD Endpoints:

POST /api/transactions: Create new expense/income.

GET /api/transactions: Fetch user history (with filters/pagination).

DELETE /api/transactions/:id: Remove entry.

[ ] Aggregations: Build specific queries for "Total Spent" and "Category Breakdown" (needed for AI Context).

1.4 AI Service Layer (The Intelligence)

[ ] Gemini Integration: Set up Google GenAI SDK on the server.

[ ] Context Builder: Create a utility function to fetch a user's recent transactions and format them into the System Prompt string.

[ ] Chat Endpoint: Build POST /api/chat.

Logic: Receive message -> Hydrate Context -> Call Gemini -> Return Text + Tool Calls.

[ ] Tool Definitions: Define the JSON Schemas for renderSpendingChart, addTransaction, etc.

Deliverable: A fully tested Express API with Auth and basic AI plumbing. (Exceeds M1 requirements).

Phase 2: The "Face" (Frontend Experience)

Course Alignment: Milestone 2 (Static Frontend)
Real Goal: Polish the existing high-fidelity React "Generative UI" prototype.

2.1 Building Block Integration (Leveraging the Prototype)

[ ] Migration: Move the existing components/Chat, components/Dashboard, and components/AddTransaction into the new repo structure.

[ ] Routing: Set up React Router to navigate between the Auth Screen and the Dashboard/Chat.

[ ] Auth UI: Create beautiful Login/Register forms that match the "Apple-esque" aesthetic of your prototype.

2.2 Refinement

[ ] Unified Message Bubble: Ensure the component renders Text AND Widgets together seamlessly (already built in prototype).

[ ] Widget Factory: Refine the switch logic (if tool == 'chart' render <Chart />) to handle dynamic data.

[ ] Local-First Mode: Ensure useExpenses hook has a toggle to work with local mock data (satisfies the "Static" requirement without breaking the app).

Deliverable: A clickable, beautiful React app that looks functional. (Satisfies M2 perfectly).

Phase 3: The Integration (Full Stack)

Course Alignment: Milestone 3 (Final Delivery)
Real Goal: Connecting the Brain to the Face.

3.1 The Great Swap (Data Binding)

This is where we switch from "Prototype Mode" to "Production Mode" by changing where the data comes from.

[ ] API Client: Configure Axios with interceptors to handle JWT refresh.

[ ] Hook Refactor:

Current (Prototype): useExpenses reads/writes to localStorage.

New (Production): useExpenses calls GET /api/transactions and POST /api/transactions.

[ ] Chat Connection:

Current (Prototype): Calls geminiService directly in browser.

New (Production): Calls POST /api/chat. The server handles the API key and context injection. The Client just receives the JSON response.

Result: The UI components (ChatInterface, Dashboard) remain 95% identical. They just receive data from a new source.

3.2 Advanced Features (The "Ferrari" Trim)

[ ] Lazy Injection: Implement the middleware check for Fixed Monthly Costs on login.

[ ] Family View: Build the read-only "Guardian Dashboard" fetching specific aggregations.

[ ] Voice Flow: Connect the browser audio blob to the backend AI parser (POST /api/voice) for real voice logging.

3.3 Final Polish

[ ] Error Handling: Graceful degradation if AI fails.

[ ] Loading States: Skeleton screens for chat and dashboard.

[ ] Deployment: Deploy.

Phase 4: Future / Post-Submission

React Native Port: Move to Expo for true native voice integration.

Client-Side Regex: Implement the hybrid categorization layer for cost reduction.