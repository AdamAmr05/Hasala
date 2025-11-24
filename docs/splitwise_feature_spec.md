# Split Feature Specification

## Overview
This feature implements a standalone group expense management system within Hasala, similar to Split. It allows users to create groups, add shared expenses, and track balances/debts between members. The feature is completely isolated from the user's personal transaction history and analytics.

## Architecture

### 1. Data Models (Backend)

#### `SplitGroup` Model (`server/src/models/SplitGroup.ts`)
Represents a group of users who share expenses.
- **Fields**:
  - `name`: String (Group name)
  - `members`: Array of objects `{ user: ObjectId, joinedAt: Date }`
  - `inviteCode`: String (Unique 8-char code for joining)
  - `currency`: String (Default 'EGP')
  - `createdBy`: ObjectId (User who created the group)
- **Purpose**: Manages membership and group identity.

#### `GroupExpense` Model (`server/src/models/GroupExpense.ts`)
Represents a single shared expense or settlement within a group.
- **Fields**:
  - `groupId`: ObjectId (Reference to SplitGroup)
  - `payer`: ObjectId (User who paid)
  - `amount`: Number (Stored in cents/smallest unit to avoid floating point errors)
  - `description`: String
  - `date`: Date
  - `splitDetails`: Array of `{ user: ObjectId, amount: Number }` (Amounts in cents)
  - `isSettlement`: Boolean (True if this is a payment between users to settle debt)
  - `category`: String (Default 'General')
- **Purpose**: Stores the raw transaction data. Balances are derived from this.

### 2. API Endpoints (`server/src/routes/groupRoutes.ts`)

- `POST /api/groups`: Create a new group.
- `GET /api/groups`: List all groups the user is part of.
- `POST /api/groups/join`: Join a group using an `inviteCode`.
- `GET /api/groups/:id`: Get group details, expenses, and **calculated balances**.
- `POST /api/groups/:id/expenses`: Add a new expense.

### 3. Logic & Algorithms (`server/src/controllers/groupController.ts`)

#### Balance Calculation
Balances are not stored in the database; they are calculated on-the-fly to ensure accuracy.
1. Fetch all expenses for the group.
2. For each expense:
   - Credit the `payer` with the full `amount`.
   - Debit each user in `splitDetails` by their respective share.
3. Result: A net balance for each user (Positive = Owed money, Negative = Owes money).

#### Debt Simplification (Greedy Algorithm)
To suggest the simplest way to settle debts:
1. **Separation**: Users are separated into two lists based on their net balance:
   - `debtors`: Users with a negative balance (they owe money).
   - `creditors`: Users with a positive balance (they are owed money).
2. **Sorting**: Both lists are sorted by the absolute value of their balance in descending order. This prioritizes settling large debts first.
3. **Matching**: We iterate through both lists using a two-pointer approach:
   - Take the largest debtor (`D`) and the largest creditor (`C`).
   - Determine the transaction amount: `min(|D.balance|, C.balance)`.
   - Record a suggested payment: "D pays C [amount]".
   - Update balances:
     - `D.balance` reduces by amount (moves closer to 0).
     - `C.balance` reduces by amount (moves closer to 0).
   - If a user's balance reaches 0 (within a small epsilon), remove them from the list and move to the next person.
4. **Repeat**: Continue until all balances are settled.
5. **Output**: A list of suggested payments (e.g., "Alice pays Bob 50 EGP").

**Why this works**: By always matching the largest available debts and credits, we greedily reduce the total outstanding volume of debt in the system, typically resulting in a minimal number of transactions.

### 4. Frontend Implementation (`client/components/Groups/`)

#### `GroupsPage.tsx`
- Lists user's groups.
- Modals for "Create Group" and "Join via Code".
- **Design**: Clean white cards, light mode aesthetic.

#### `GroupView.tsx`
- **Header**: Group name, invite code copy.
- **Balances**:
  - "Your Net Balance": Green (owed) or Red (owe).
  - "Suggested Payments": List of simplified debts.
- **Activity Feed**: List of recent expenses.
- **Add Expense Button**: Opens the modal.

#### `AddGroupExpenseModal.tsx`
- **Inputs**: Description, Amount (EGP).
- **Split Methods**:
  1. **Equal**: 
     - Dynamic selection of members.
     - Automatically divides amount by selected count.
  2. **Exact**:
     - Manually input amounts for each person.
     - Validates that sum equals total.
     - Shows "Remaining" amount feedback.
  3. **Percent**:
     - Input percentages.
     - Defaults to equal distribution on switch.
     - Validates sum equals 100%.
     - Shows "Remaining %" feedback.

## Isolation Strategy
- **Database**: Uses separate collections (`splitgroups`, `groupexpenses`) unrelated to `transactions` or `familygroups`.
- **Logic**: No shared controllers or services with personal finance features.
- **UI**: Dedicated route `/groups` and components.

## Future Improvements
- **Settlement UI**: A dedicated "Settle Up" button that pre-fills a payment transaction.
- **Notifications**: Alert members when an expense is added.
- **Activity Log**: Detailed history of changes (e.g., "Alice updated the expense").

### 5. Security & Validation
- **Authentication**: All routes protected by `protect` middleware.
- **Authorization**: Explicit checks for group membership in controller.
- **Input Validation**:
  - Amounts must be positive (`min: 0.01`).
  - Split participants must be members of the group.
  - Split amounts must sum to total (within 0.1 tolerance).
- **Frontend Safety**:
  - Safe access for avatars (`name[0]`).
  - Graceful handling of auth failures.
  - Strict TypeScript interfaces.
