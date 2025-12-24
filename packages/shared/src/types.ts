// ============================================================================
// Shared Types for Hasala (Web + Mobile)
// ============================================================================

export enum TransactionType {
    EXPENSE = 'EXPENSE',
    INCOME = 'INCOME',
}

export enum Category {
    FOOD = 'Food',
    TRANSPORT = 'Transport',
    ENTERTAINMENT = 'Entertainment',
    SHOPPING = 'Shopping',
    BILLS = 'Bills',
    EDUCATION = 'Education',
    INCOME = 'Income',
    SALARY = 'Salary',
    GIVING = 'Giving',
    HOUSING = 'Housing',
    OTHER = 'Other',
}

export interface Transaction {
    id: string;
    amount: number;
    description: string;
    category: Category;
    date: string; // ISO string
    type: TransactionType;
    isRecurring?: boolean;
    relatedPerson?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    budget: number;
}

export enum ChatSender {
    USER = 'user',
    AI = 'model',
}

export interface ToolCall {
    name: string;
    args?: Record<string, unknown>;
}

export interface ChatMessage {
    id: string;
    sender: ChatSender;
    text: string;
    timestamp: number;
    toolCalls?: ToolCall[];
}

export interface FamilyMember {
    id: string;
    name: string;
    avatar: string;
    monthlySpend: number;
    status: 'safe' | 'warning' | 'critical';
}

export interface ChatResponse {
    text: string;
    toolCalls?: ToolCall[];
    createdTransactions?: Transaction[];
    threadId?: string;
    messageId?: string;
}

export interface SavingsGoal {
    _id?: string;
    name: string;
    current?: number;
    currentAmount?: number;
    target?: number;
    targetAmount?: number;
    progress?: number;
    color: string;
    icon: string;
    stepAmount?: number;
    deadline?: string;
}

// API Response types
export interface AuthResponse {
    _id: string;
    name: string;
    email: string;
    budget: number;
    token?: string; // Token for mobile clients (not sent to web)
}

export interface ChatThread {
    _id: string;
    title: string;
    lastMessageAt: string;
}

export interface TransactionPayload {
    amount: number;
    description: string;
    category: Category;
    type: TransactionType;
    date?: string;
    isRecurring?: boolean;
    relatedPerson?: string;
}

export interface TransactionListResponse {
    data: Transaction[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasMore: boolean;
    };
}

export interface AnalyticsResponse {
    totals: Array<{ _id: TransactionType; total: number }>;
    categoryBreakdown: Array<{ _id: string; total: number }>;
    dailyTrend: Array<{ _id: string; total: number }>;
    peopleBreakdown: Array<{ _id: string; total: number }>;
    incomeBreakdown: Array<{ _id: string; total: number }>;
}

export interface RecurringTransaction {
    _id: string;
    user: string;
    amount: number;
    description: string;
    category: Category;
    type: TransactionType;
    dayOfMonth: number;
    lastInjected: Date;
    isActive: boolean;
}

// Family types
export interface FamilyCategoryBreakdown {
    name: string;
    amount: number;
}

export interface FamilyMemberSummary {
    user: {
        _id: string;
        name: string;
    };
    role: 'ADMIN' | 'MEMBER';
    joinedAt: string;
    totalSpent: number;
    totalIncome: number;
    budget: number;
    budgetPercentUsed: number;
    topCategory: FamilyCategoryBreakdown | null;
    categoryBreakdown: FamilyCategoryBreakdown[];
    status: 'safe' | 'warning' | 'critical';
    insight: string;
}

export interface FamilyGroup {
    _id: string;
    name: string;
    inviteCode: string;
    members: Array<{
        user: { _id: string; name: string; email?: string } | string;
        role: 'ADMIN' | 'MEMBER';
        joinedAt: string;
    }>;
}

export interface FamilyDetailsResponse {
    family: FamilyGroup;
    members: FamilyMemberSummary[];
}
