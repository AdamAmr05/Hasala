// ============================================================================
// Auth Store using Expo Secure Store
// ============================================================================

import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'hasala_auth_token';
const USER_DATA_KEY = 'hasala_user_data';

export interface StoredUser {
    id: string;
    name: string;
    email: string;
    budget: number;
}

export const authStore = {
    async getToken(): Promise<string | null> {
        try {
            return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        } catch {
            return null;
        }
    },

    async setToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    },

    async removeToken(): Promise<void> {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    },

    async getUser(): Promise<StoredUser | null> {
        try {
            const data = await SecureStore.getItemAsync(USER_DATA_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    async setUser(user: StoredUser): Promise<void> {
        await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
    },

    async removeUser(): Promise<void> {
        await SecureStore.deleteItemAsync(USER_DATA_KEY);
    },

    async clear(): Promise<void> {
        await Promise.all([
            SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
            SecureStore.deleteItemAsync(USER_DATA_KEY),
        ]);
    },
};
