import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createApiClient } from '@hasala/shared';

import { authStore, StoredUser } from './store/authStore';
import { API_BASE_URL } from './config';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import SettingsScreen from './screens/SettingsScreen';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Initialize API client
createApiClient({
  baseURL: API_BASE_URL,
  getAuthToken: () => authStore.getToken(),
});

// Navigation theme - must conform exactly to the Theme type
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
    background: '#0D0D0F',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#3A3A3C',
    notification: '#FF3B30',
  },
};

// Tab Navigator
const Tab = createBottomTabNavigator();

// Simple placeholder screens as separate components
function ChatScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderEmoji}>💬</Text>
      <Text style={styles.placeholderText}>AI Chat</Text>
      <Text style={styles.placeholderSubtext}>Coming soon</Text>
    </View>
  );
}

function AnalyticsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderEmoji}>📊</Text>
      <Text style={styles.placeholderText}>Analytics</Text>
      <Text style={styles.placeholderSubtext}>Coming soon</Text>
    </View>
  );
}

interface MainTabsProps {
  user: StoredUser;
  onLogout: () => void;
}

function MainTabs({ user, onLogout }: MainTabsProps) {
  // Wrapper for settings that passes props
  const SettingsWrapper = useCallback(
    () => <SettingsScreen user={user} onLogout={onLogout} />,
    [user, onLogout]
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#6B6B6B',
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#3A3A3C',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#1C1C1E',
        },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Hasala',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 22, color: color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'AI Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 22, color: color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 22, color: color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsWrapper}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }: { color: string }) => (
            <Text style={{ fontSize: 22, color: color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    // Check for existing session
    authStore.getUser().then((storedUser) => {
      setUser(storedUser);
      setIsLoading(false);
    });
  }, []);

  const handleLoginSuccess = useCallback(async () => {
    const storedUser = await authStore.getUser();
    setUser(storedUser);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    queryClient.clear();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0F" />
        <NavigationContainer theme={DarkTheme}>
          {user ? (
            <MainTabs user={user} onLogout={handleLogout} />
          ) : (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B6B6B',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B6B6B',
  },
});
