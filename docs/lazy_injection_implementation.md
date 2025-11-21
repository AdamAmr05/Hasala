# Lazy Injection: Technical Reference Manual

## 1. Executive Summary
**Lazy Injection** is a middleware-driven architectural pattern designed to automate recurring expenses without the overhead of persistent server-side schedulers (cron jobs).

**The Core Principle**: "Just-in-Time Consistency."
The database state for recurring expenses is allowed to be "stale" while the user is inactive. It is only "healed" (updated) the moment the user requests data. This guarantees 100% data accuracy for the user while reducing server idle compute time to near zero.

---

## 2. System Architecture

### 2.1 The Request Flow
The injection logic is hooked directly into the primary data retrieval endpoint (`GET /api/transactions`).

1.  **Client Request**: User opens Dashboard -> `GET /api/transactions`
2.  **Middleware Intercept**: `transactionController.ts` intercepts the request.
3.  **Injection Logic**: Calls `checkAndInjectRecurring(userId)`.
4.  **Heal State**:
    *   Fetches active `RecurringExpense` rules.
    *   Iterates from `lastInjected` date to `NOW`.
    *   Creates missing `Transaction` records (backdated).
    *   Updates `lastInjected` pointer.
5.  **Response**: The controller proceeds to fetch the (now updated) transaction list and returns it to the client.

### 2.2 File Map
*   **`server/src/models/RecurringExpense.ts`**: The Schema definition.
*   **`server/src/controllers/recurringController.ts`**: The core logic (`checkAndInjectRecurring`).
*   **`server/src/controllers/transactionController.ts`**: The integration hook.
*   **`server/src/controllers/chatController.ts`**: AI awareness logic.

---

## 3. Implementation Details

### 3.1 The Schema (`RecurringExpense`)
The "Blueprint" for future transactions.

```typescript
const RecurringExpenseSchema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: Object.values(Category) },
  dayOfMonth: { type: Number, min: 1, max: 31 }, // The "Ideal" day
  lastInjected: { type: Date }, // The "Safety Pointer"
  isActive: { type: Boolean, default: true }
});
```

### 3.2 The Injection Logic (`recurringController.ts`)
This is the engine that "heals" the data.

```typescript
export const checkAndInjectRecurring = async (userId: string) => {
    const recurringExpenses = await RecurringExpense.find({ user: userId, isActive: true });
    const now = new Date();
    const createdTransactions = [];

    for (const expense of recurringExpenses) {
        // Start checking from the month AFTER the last injection
        let targetDate = new Date(expense.lastInjected);
        targetDate.setMonth(targetDate.getMonth() + 1);
        
        // "Drift-Proof" Date Calculation
        const daysInTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const actualDay = Math.min(expense.dayOfMonth, daysInTargetMonth);
        targetDate.setDate(actualDay);

        // Catch-up Loop: While target date is in the past
        while (targetDate <= now) {
            // 1. Create the Transaction (Backdated)
            const newTransaction = await Transaction.create({
                user: userId,
                amount: expense.amount,
                description: expense.description + ' (Auto)',
                category: expense.category,
                type: TransactionType.EXPENSE,
                date: targetDate, // <--- Crucial: Backdated to due date
                isRecurring: true,
            });

            createdTransactions.push(newTransaction);

            // 2. Update the Safety Pointer
            expense.lastInjected = targetDate;
            await expense.save();

            // 3. Move to next month
            targetDate = new Date(targetDate);
            targetDate.setMonth(targetDate.getMonth() + 1);
            
            // 4. Re-calculate Day (Prevent Drift)
            const daysInNextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
            const nextActualDay = Math.min(expense.dayOfMonth, daysInNextMonth);
            targetDate.setDate(nextActualDay);
        }
    }

    return createdTransactions;
};
```

### 3.3 The Hook (`transactionController.ts`)
How we connect it to the user experience.

```typescript
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    // Lazy Injection Hook
    if (req.user?._id) {
      await checkAndInjectRecurring(req.user._id.toString());
    }

    // ... proceed to fetch transactions ...
```

---

## 4. Edge Case Handling: "The Drift Problem"

### The Scenario
A user sets a bill for the **31st** of the month.
*   **January 31**: Paid.
*   **February**: Only has 28 days.

### The Naive Approach (Buggy)
If we just did `date.setMonth(date.getMonth() + 1)`:
1.  Jan 31 + 1 Month -> **Feb 28** (JS auto-corrects).
2.  Feb 28 + 1 Month -> **Mar 28**.
3.  Mar 28 + 1 Month -> **Apr 28**.
**Result**: The bill permanently drifts to the 28th. The user loses 3 days of credit every month.

### The "Drift-Proof" Solution
We store the **Ideal Day** (`dayOfMonth: 31`) in the database and recalculate the target date fresh every iteration.

1.  **February Iteration**:
    *   Target Month: Feb.
    *   Days in Feb: 28.
    *   Calculation: `Math.min(31, 28) = 28`.
    *   **Result**: Bill created for **Feb 28**.

2.  **March Iteration**:
    *   Target Month: March.
    *   Days in Mar: 31.
    *   Calculation: `Math.min(31, 31) = 31`.
    *   **Result**: Bill snaps back to **Mar 31**.

---

## 5. AI Integration

The AI needs to know about these "invisible" bills to give accurate advice. We inject this context into the System Prompt in `chatController.ts`.

```typescript
// 1. Fetch Active Rules
const recurringExpenses = await RecurringExpense.find({ user: req.user._id, isActive: true });

// 2. Filter for "Upcoming" (Due later this month)
const upcomingBills = recurringExpenses.filter(expense => {
  return expense.dayOfMonth >= today.getDate();
});

// 3. Inject into Prompt
const systemInstruction = `
...
- Upcoming Recurring Bills (This Month): ${upcomingLiabilitiesText}
...
`;
```

**User Benefit**:
User: "Can I afford these shoes?"
AI: "You have 2000 EGP, but remember you have a 500 EGP Rent payment coming up on the 25th!"

---

## 6. Verification & Testing

### 6.1 The "Rewind" Test
To verify this logic without waiting a month, we implemented a temporary "Rewind" feature (now removed).
1.  **Action**: Manually set `lastInjected` to 2 months ago.
2.  **Trigger**: Refresh Dashboard.
3.  **Result**: The loop runs twice, creating 2 backdated transactions (e.g., Oct 1 and Nov 1).
4.  **Confirmation**: This proved the "Catch-up Loop" works for multiple missed cycles.
