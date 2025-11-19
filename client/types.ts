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
}

export interface User {
  id: string;
  name: string;
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
  toolCalls?: ToolCall[]; // New: Store tool calls directly on the message
}

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string; // URL
  monthlySpend: number;
  status: 'safe' | 'warning' | 'critical';
}

// Response from the AI Service
export interface ChatResponse {
  text: string;
  toolCalls?: ToolCall[];
  createdTransactions?: Transaction[];
}