import axios from 'axios';
import {
  Transaction,
  ChatMessage,
  ChatResponse,
  Category,
  TransactionType,
  User,
} from '../types';

export { Category, TransactionType }; // Re-export for convenience

export interface ChatThread {
  _id: string;
  title: string;
  lastMessageAt: string;
}

// Auto-detect: use network URL when accessing from network, localhost otherwise
const isNetworkAccess = window.location.hostname === '192.168.1.7';
const API_BASE_URL = (
  isNetworkAccess
    ? (import.meta.env.VITE_API_BASE_URL_N || 'http://192.168.1.7:5001/api')
    : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api')
).replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${API_BASE_URL}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  budget: number;
}

export interface ChatRequestPayload {
  message: string;
  history?: Array<{ sender: string; text: string }>;
}

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', payload).then((res) => res.data),

  login: (payload: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', payload).then((res) => res.data),

  logout: () => api.post('/auth/logout'),
  me: async () => {
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  },
  updateProfile: async (data: Partial<User>) => {
    const response = await api.put<AuthResponse>('/auth/profile', data);
    return response.data;
  },
};

interface ApiTransaction {
  _id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  date: string;
  isRecurring?: boolean;
  relatedPerson?: string;
}

const normalizeTransaction = (tx: ApiTransaction): Transaction => ({
  id: tx._id,
  amount: tx.amount,
  description: tx.description,
  category: (tx.category as Category) || Category.OTHER,
  type: tx.type,
  date: tx.date ?? new Date().toISOString(),
  isRecurring: tx.isRecurring,
  relatedPerson: tx.relatedPerson,
});

const normalizeChatTransactions = (
  items?: Array<Partial<ApiTransaction> & { id?: string }>
): Transaction[] =>
  (items ?? []).map((tx) => ({
    id:
      tx.id ||
      (tx as ApiTransaction)?._id ||
      (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
    amount: tx.amount ?? 0,
    description: tx.description ?? '',
    category: (tx.category as Category) || Category.OTHER,
    type: (tx.type as TransactionType) || TransactionType.EXPENSE,
    date: tx.date ?? new Date().toISOString(),
    isRecurring: tx.isRecurring,
    relatedPerson: tx.relatedPerson,
  }));

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

export const transactionsApi = {
  list: (params?: { page?: number; limit?: number; month?: number; year?: number; signal?: AbortSignal }) =>
    api.get<{ data: ApiTransaction[]; meta: any }>('/transactions', { params, signal: params?.signal }).then((res) => ({
      data: res.data.data.map(normalizeTransaction),
      meta: res.data.meta,
    })),
  create: (payload: TransactionPayload) =>
    api.post<ApiTransaction>('/transactions', payload).then((res) => normalizeTransaction(res.data)),
  remove: (id: string) => api.delete(`/transactions/${id}`),
  getAnalytics: (period: number = 30, month?: number, year?: number) =>
    api.get<AnalyticsResponse>('/transactions/analytics', { params: { period, month, year } }).then((res) => res.data),
};

export interface AnalyticsResponse {
  totals: Array<{ _id: TransactionType; total: number }>;
  categoryBreakdown: Array<{ _id: string; total: number }>;
  dailyTrend: Array<{ _id: string; total: number }>;
  peopleBreakdown: Array<{ _id: string; total: number }>;
  incomeBreakdown: Array<{ _id: string; total: number }>;
}

export const chatApi = {
  send: (payload: { message: string; history?: ChatMessage[]; threadId?: string }) =>
    api
      .post<ChatResponse>('/chat', {
        message: payload.message,
        threadId: payload.threadId,
        history: payload.history?.map((msg) => ({
          sender: msg.sender,
          text: msg.text,
        })),
        clientTimestamp: new Date().toISOString(),
      })
      .then((res) => ({
        ...res.data,
        createdTransactions: normalizeChatTransactions(res.data.createdTransactions as any),
      })),
  getThreads: () => api.get<ChatThread[]>('/chat').then((res) => res.data),
  getMessages: (threadId: string) => api.get<ChatMessage[]>(`/chat/${threadId}`).then((res) => res.data),
  deleteThread: (threadId: string) => api.delete(`/chat/${threadId}`),
};

type ParsedTransactionResponse = {
  transactions: Array<Partial<{
    amount: number;
    description: string;
    category: string;
    type: TransactionType;
    relatedPerson: string;
  }>>;
};

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

export const recurringApi = {
  getAll: async () => {
    const response = await api.get<RecurringTransaction[]>('/recurring');
    return response.data;
  },
  create: async (data: { amount: number; description: string; category: Category; type: TransactionType; dayOfMonth: number }) => {
    const response = await api.post<RecurringTransaction>('/recurring', data);
    return response.data;
  },
  remove: async (id: string) => {
    const response = await api.delete(`/recurring/${id}`);
    return response.data;
  },
  rewind: async (id: string) => {
    const response = await api.post(`/recurring/${id}/rewind`);
    return response.data;
  },
};

export const aiApi = {
  parseText: (input: string) =>
    api.post<ParsedTransactionResponse>('/ai/parse-text', { input }).then((res) => res.data),
  parseVoice: (audio: string) =>
    api.post<ParsedTransactionResponse>('/ai/parse-voice', { audio }).then((res) => res.data),
};
