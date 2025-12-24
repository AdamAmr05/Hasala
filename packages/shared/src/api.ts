// ============================================================================
// Shared API Client for Hasala (Web + Mobile)
// ============================================================================
// This module provides a platform-agnostic API client that can be configured
// for both web and React Native environments.

import axios, { AxiosInstance } from 'axios';
import {
    Transaction,
    ChatMessage,
    ChatResponse,
    Category,
    TransactionType,
    User,
    AuthResponse,
    ChatThread,
    TransactionPayload,
    AnalyticsResponse,
    RecurringTransaction,
    SavingsGoal,
    FamilyGroup,
    FamilyDetailsResponse,
} from './types';

export { Category, TransactionType };

// ============================================================================
// API Client Factory
// ============================================================================

export interface ApiConfig {
    baseURL: string;
    withCredentials?: boolean;
    getAuthToken?: () => Promise<string | null>;
}

let apiInstance: AxiosInstance | null = null;

export function createApiClient(config: ApiConfig): AxiosInstance {
    const client = axios.create({
        baseURL: config.baseURL,
        withCredentials: config.withCredentials ?? false,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Add auth token interceptor for mobile (where cookies don't work)
    if (config.getAuthToken) {
        client.interceptors.request.use(async (reqConfig) => {
            const token = await config.getAuthToken!();
            console.log('🔑 API Interceptor - Token retrieved:', token ? token.substring(0, 20) + '...' : 'NULL');
            if (token) {
                reqConfig.headers.Authorization = `Bearer ${token}`;
                console.log('🔑 Added Authorization header');
            } else {
                console.log('⚠️ No token available for request to:', reqConfig.url);
            }
            return reqConfig;
        });
    }

    apiInstance = client;
    return client;
}

export function getApiClient(): AxiosInstance {
    if (!apiInstance) {
        throw new Error('API client not initialized. Call createApiClient first.');
    }
    return apiInstance;
}

// ============================================================================
// Transaction Normalization
// ============================================================================

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
        id: tx.id || (tx as ApiTransaction)?._id || Math.random().toString(36).slice(2),
        amount: tx.amount ?? 0,
        description: tx.description ?? '',
        category: (tx.category as Category) || Category.OTHER,
        type: (tx.type as TransactionType) || TransactionType.EXPENSE,
        date: tx.date ?? new Date().toISOString(),
        isRecurring: tx.isRecurring,
        relatedPerson: tx.relatedPerson,
    }));

// ============================================================================
// API Services
// ============================================================================

export const authApi = {
    register: (payload: { name: string; email: string; password: string }) =>
        getApiClient().post<AuthResponse>('/auth/register', payload).then((res) => res.data),

    login: (payload: { email: string; password: string }) =>
        getApiClient().post<AuthResponse>('/auth/login', payload).then((res) => res.data),

    logout: () => getApiClient().post('/auth/logout'),

    me: async () => {
        const response = await getApiClient().get<AuthResponse>('/auth/me');
        return response.data;
    },

    updateProfile: async (data: Partial<User>) => {
        const response = await getApiClient().put<AuthResponse>('/auth/profile', data);
        return response.data;
    },
};

export const transactionsApi = {
    list: (params?: { page?: number; limit?: number; month?: number; year?: number; signal?: AbortSignal }) => {
        const { signal, ...queryParams } = params || {};
        return getApiClient()
            .get<{ data: ApiTransaction[]; meta: any }>('/transactions', { params: queryParams, signal })
            .then((res) => ({
                data: res.data.data.map(normalizeTransaction),
                meta: res.data.meta,
            }));
    },

    create: (payload: TransactionPayload) =>
        getApiClient().post<ApiTransaction>('/transactions', payload).then((res) => normalizeTransaction(res.data)),

    createBulk: (payloads: TransactionPayload[]) =>
        getApiClient().post<ApiTransaction[]>('/transactions/bulk', payloads).then((res) => res.data.map(normalizeTransaction)),

    remove: (id: string) => getApiClient().delete(`/transactions/${id}`),

    getAnalytics: (period: number = 30, month?: number, year?: number, timezone?: string) =>
        getApiClient().get<AnalyticsResponse>('/transactions/analytics', { params: { period, month, year, timezone } }).then((res) => res.data),
};

export const chatApi = {
    send: (payload: { message: string; history?: ChatMessage[]; threadId?: string; clientTimestamp?: string; timezone?: string }) =>
        getApiClient()
            .post<ChatResponse>('/chat', {
                message: payload.message,
                threadId: payload.threadId,
                history: payload.history?.map((msg) => ({
                    sender: msg.sender,
                    text: msg.text,
                })),
                clientTimestamp: payload.clientTimestamp,
                timezone: payload.timezone,
            })
            .then((res) => ({
                ...res.data,
                createdTransactions: normalizeChatTransactions(res.data.createdTransactions as any),
            })),

    getThreads: () => getApiClient().get<ChatThread[]>('/chat').then((res) => res.data),
    getMessages: (threadId: string) => getApiClient().get<ChatMessage[]>(`/chat/${threadId}`).then((res) => res.data),
    deleteThread: (threadId: string) => getApiClient().delete(`/chat/${threadId}`),
};

export const recurringApi = {
    getAll: async () => {
        const response = await getApiClient().get<RecurringTransaction[]>('/recurring');
        return response.data;
    },

    create: async (data: { amount: number; description: string; category: Category; type: TransactionType; dayOfMonth: number }) => {
        const response = await getApiClient().post<RecurringTransaction>('/recurring', data);
        return response.data;
    },

    remove: async (id: string) => {
        const response = await getApiClient().delete(`/recurring/${id}`);
        return response.data;
    },

    rewind: async (id: string) => {
        const response = await getApiClient().post(`/recurring/${id}/rewind`);
        return response.data;
    },
};

export const savingsApi = {
    list: () => getApiClient().get<SavingsGoal[]>('/savings').then((res) => res.data),
    create: (data: Omit<SavingsGoal, '_id'>) => getApiClient().post<SavingsGoal>('/savings', data).then((res) => res.data),
    update: (id: string, data: Partial<SavingsGoal> & { delta?: number }) =>
        getApiClient().patch<SavingsGoal>(`/savings/${id}`, data).then((res) => res.data),
    remove: (id: string) => getApiClient().delete(`/savings/${id}`),
};

export const aiApi = {
    parseText: (input: string) =>
        getApiClient().post<{ transactions: Array<Partial<TransactionPayload>> }>('/ai/parse-text', { input }).then((res) => res.data),
    parseVoice: (audio: string) =>
        getApiClient().post<{ transactions: Array<Partial<TransactionPayload>> }>('/ai/parse-voice', { audio }).then((res) => res.data),
    generateInfographic: () =>
        getApiClient().post<{ image: string }>('/ai/generate-infographic').then((res) => res.data),
};

export const familyApi = {
    list: () => getApiClient().get<FamilyGroup[]>('/family').then((res) => res.data),
    create: (name: string) => getApiClient().post<FamilyGroup>('/family', { name }).then((res) => res.data),
    join: (inviteCode: string) => getApiClient().post<FamilyGroup>('/family/join', { inviteCode }).then((res) => res.data),
    getDetails: (id: string) => getApiClient().get<FamilyDetailsResponse>(`/family/${id}`).then((res) => res.data),
    leave: (id: string) => getApiClient().post<{ message: string }>(`/family/${id}/leave`).then((res) => res.data),
};
