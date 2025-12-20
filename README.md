# Hasala (حصالة)

**Course:** Electronic Business Development (BINF 503)  
**Semester:** Winter 2025  
**Instructor:** Dr. Nourhan Hamdi

## 1. Team Members

| Name | Student ID | GitHub Username |
|------|------------|-----------------|
| Adam Amr | 13004957 | @AdamAmr05 |
| Ahmed yasser | 13007130 | @HaloXD1 |
| Mohamed Wael | 13002352 | @Mohamedwaell2 |
| Andrew George | 13006866 | @Andrewgeorge-6966 |

## 2. Project Description

Hasala is a personal finance application designed specifically for Egyptian university students. It transforms financial management from a burdensome chore into a seamless experience through a design-first approach and meaningful AI integration.

Unlike traditional expense trackers that require tedious manual entry, Hasala leverages localized AI to understand Egyptian spending habits (e.g., "Koshary," "Uber," "Fawry") via voice and text, providing automated categorization and intelligent financial coaching.

**Concept:** An AI-powered financial wellness platform for Egyptian students.  
**Core Value:** Frictionless tracking (Voice/AI) + Actionable Insight (Generative UI) + Social Expense Splitting.  
**Link to Fin-Tech Course Document:** [Insert Link if applicable]

## 3. Feature Breakdown

### 3.1 Full Scope (Product Vision)

List of all potential features envisioned for the complete product:

- **Voice-First Entry:** Egyptian Arabic speech recognition for instant logging.
- **Generative UI Chat:** An AI assistant that renders dynamic charts and widgets inside the chat stream.
- **Family Sync:** Opt-in collaborative spending views for families.
- **Smart Budgets:** Auto-adjusting budgets based on spending pace.
- **Bill Payment Integration:** Direct integration with payment providers (Fawry/Telda).
- **Recurring Expenses:** Auto-injection of fixed monthly costs.
- **Custom AI Categories:** User-defined spending categories that retrain the AI parsing logic.
- **Split Groups:** Splitwise-like expense splitting with friends, debt simplification, and settlement tracking.

### 3.2 Selected MVP Use Cases (Course Scope)

These are the 7 core features we will implement for the MVP:

1. **User Authentication:** Secure Registration and Login with persistent sessions (JWT/Cookies).
2. **Smart Transaction Logging:** Adding expenses/income via text/voice with AI categorization.
3. **Intelligent Dashboard:** Real-time visualization of balance, spending pace, and recent activity.
4. **AI Financial Coach (Chat):** A conversational interface that queries transaction history and renders dynamic insights (Generative UI).
5. **Family/Guardian View:** A collaborative view for linked family members to monitor specific spending categories.
6. **Budget Management:** Creating and tracking monthly spending limits.
7. **Fixed Monthly Costs:** Logic to auto-inject recurring expenses (Rent, Subscriptions) at the start of each billing cycle.
8. **Split Groups:** Group expense management with multiple split methods (equal, percentage, exact), debt simplification algorithm, and settlement tracking.

## 4. Feature Assignments (Accountability)

| Team Member | Assigned Use Case | Brief Description of Responsibility |
|-------------|-------------------|-------------------------------------|
| Adam Amr | Smart Transaction Logging | Implementation of the Transaction model, AI parsing logic (AI integration), and the "Add Transaction" UI/Voice flow. |
| Ahmed yasser | Fixed Monthly Costs | Logic to auto-inject recurring expenses based on date triggers and manage subscription lists. |
| Adam Amr | AI Core Integration | Development of the shared AI service layer used by both logging and chat features. |
| Adam Amr | AI Financial Coach (Chat) | The Chat Interface, history storage in MongoDB, and context-aware system prompting logic. |
| Adam Amr | Split Groups | Group creation, expense splitting (equal/percentage/exact), debt simplification algorithm, and settlement flow. |
| Ahmed Yasser | Intelligent Dashboard | Aggregation logic (summing totals, calculating category %) and the main Home View visualization components. (analytics and charts) |
| Mohamed Wael | Family/Guardian View | Logic for linking users, FamilyGroup schema, and the collaborative dashboard view. |
| Andrew George | User Authentication | Secure user registration and login system with session management. |

## 5. Data Model (Initial Schemas)

### User Schema

```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  budget: { type: Number, default: 0 } // Monthly spending limit
}, { timestamps: true });
```

### Transaction Schema

```javascript
const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // Stored as decimal 
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Education', 'Income', 'Salary', 'Giving', 'Housing', 'Other'],
    required: true 
  },
  type: { type: String, enum: ['EXPENSE', 'INCOME'], required: true },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  relatedPerson: { type: String, trim: true } // Track who received money (for Giving)
}, { timestamps: true });
```

### Budget Schema

```javascript
const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true }, // 'Food' or 'Global'
  limit: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'weekly'], default: 'monthly' }
});
```

### FamilyGroup Schema

```javascript
const FamilyGroupSchema = new mongoose.Schema({
  name: { type: String, default: 'My Family' },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'viewer'], default: 'viewer' },
    status: { type: String, enum: ['active', 'invited'] }
  }]
});
```

### RecurringTransaction Schema

```javascript
const RecurringTransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['EXPENSE', 'INCOME'], default: 'EXPENSE' },
  dayOfMonth: { type: Number, required: true, min: 1, max: 31 },
  lastInjected: { type: Date, required: true }, // For lazy injection pattern
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

---

## 6. Getting Started

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** (local or Atlas connection string)

### Environment Variables

Create a `.env` file in the `server/` directory:

```bash
MONGODB_URI=mongodb://localhost:27017/hasala  # or your MongoDB Atlas URI
JWT_SECRET=your-secure-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

**Optional** (client-side, only if not using defaults): Create `.env` in `client/`:

```bash
VITE_API_BASE_URL=http://localhost:5001/api
```

### Installation & Running

**1. Install dependencies:**

```bash
# Server
cd server && npm install

# Client (in a new terminal)
cd client && npm install
```

**2. Start the application:**

```bash
# Terminal 1 - Start server (runs on port 5001)
cd server && npm run dev

# Terminal 2 - Start client (runs on port 5173)
cd client && npm run dev
```

**3. Open** [http://localhost:5173](http://localhost:5173) in your browser.

---

**Note:** These schemas will likely be iterated on, this is not final.
