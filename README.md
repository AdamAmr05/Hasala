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
**Core Value:** Frictionless tracking (Voice/AI) + Actionable Insight (Generative UI).  
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

### 3.2 Selected MVP Use Cases (Course Scope)

These are the 7 core features we will implement for the MVP:

1. **User Authentication:** Secure Registration and Login with persistent sessions (JWT/Cookies).
2. **Smart Transaction Logging:** Adding expenses/income via text/voice with AI categorization.
3. **Intelligent Dashboard:** Real-time visualization of balance, spending pace, and recent activity.
4. **AI Financial Coach (Chat):** A conversational interface that queries transaction history and renders dynamic insights (Generative UI).
5. **Family/Guardian View:** A collaborative view for linked family members to monitor specific spending categories.
6. **Budget Management:** Creating and tracking monthly spending limits per category.
7. **Fixed Monthly Costs:** Logic to auto-inject recurring expenses (Rent, Subscriptions) at the start of each billing cycle.

## 4. Feature Assignments (Accountability)

| Team Member | Assigned Use Case | Brief Description of Responsibility |
|-------------|-------------------|-------------------------------------|
| Adam Amr | Smart Transaction Logging | Implementation of the Transaction model, AI parsing logic (AI integration), and the "Add Transaction" UI/Voice flow. |
| Ahmed yasser | Fixed Monthly Costs | Logic to auto-inject recurring expenses based on date triggers and manage subscription lists. |
| Adam Amr | AI Core Integration | Development of the shared AI service layer used by both logging and chat features. |
| Adam Amr | User Authentication | Full-stack auth flow: bcrypt hashing, JWT generation, secure cookie handling, and protected routes middleware. |
| Adam Amr | AI Financial Coach (Chat) | The Chat Interface, history storage in MongoDB, and context-aware system prompting logic. |
| Ahmed Yasser | Intelligent Dashboard | Aggregation logic (summing totals, calculating category %) and the main Home View visualization components. (analytics and charts) |
| Mohamed Wael | Family/Guardian View | Logic for linking users, FamilyGroup schema, and the collaborative dashboard view. |
| Andrew George | Budget Management | CRUD for budgets, progress calculation logic, and visual budget indicators. (not completely separate from analytics) |

## 5. Data Model (Initial Schemas)

### User Schema

```javascript
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  settings: {
    currency: { type: String, default: 'EGP' },
    language: { type: String, default: 'en' }
  },
  createdAt: { type: Date, default: Date.now }
});
```

### Transaction Schema

```javascript
const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Education', 'Income', 'Other'],
    required: true 
  },
  type: { type: String, enum: ['EXPENSE', 'INCOME'], required: true },
  date: { type: Date, default: Date.now },
  isRecurring: { type: Boolean, default: false },
  isVoiceEntry: { type: Boolean, default: false }
});
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

### RecurringExpense Schema

```javascript
const RecurringExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  dayOfMonth: { type: Number, required: true }, // 1st or 15th etc.
  isActive: { type: Boolean, default: true }
});
```

---

**Note:** These schemas will likely be iterated on, this is not final.
