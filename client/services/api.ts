import axios from 'axios';
import {
  Transaction,
  ChatMessage,
  ChatResponse,
  Category,
  TransactionType,
} from '../types';

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
  me: () =>
    api
      .get<AuthResponse>('/auth/me')
      .then((res) => res.data),
};

interface ApiTransaction {
  _id: string;
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
  date: string;
  isRecurring?: boolean;
}

const normalizeTransaction = (tx: ApiTransaction): Transaction => ({
  id: tx._id,
  amount: tx.amount,
  description: tx.description,
  category: (tx.category as Category) || Category.OTHER,
  type: tx.type,
  date: tx.date ?? new Date().toISOString(),
  isRecurring: tx.isRecurring,
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
  }));

export interface TransactionPayload {
  amount: number;
  description: string;
  category: Category;
  type: TransactionType;
  date?: string;
  isRecurring?: boolean;
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
  list: (params?: { page?: number; limit?: number; month?: number; year?: number }) =>
    api.get<{ data: ApiTransaction[]; meta: any }>('/transactions', { params }).then((res) => ({
      data: res.data.data.map(normalizeTransaction),
      meta: res.data.meta,
    })),
  create: (payload: TransactionPayload) =>
    api.post<ApiTransaction>('/transactions', payload).then((res) => normalizeTransaction(res.data)),
  remove: (id: string) => api.delete(`/transactions/${id}`),
};

export const chatApi = {
  send: (payload: { message: string; history?: ChatMessage[] }) =>
    api
      .post<ChatResponse>('/chat', {
        message: payload.message,
        history: payload.history?.map((msg) => ({
          sender: msg.sender,
          text: msg.text,
        })),
      })
      .then((res) => ({
        ...res.data,
        createdTransactions: normalizeChatTransactions(res.data.createdTransactions as any),
      })),
};

type ParsedTransactionResponse = Partial<{
  amount: number;
  description: string;
  category: string;
  type: TransactionType;
}>;

export const aiApi = {
  parseText: (input: string) =>
    api.post<ParsedTransactionResponse>('/ai/parse-text', { input }).then((res) => res.data),
  parseVoice: (audio: string) =>
    api.post<ParsedTransactionResponse>('/ai/parse-voice', { audio }).then((res) => res.data),
};

