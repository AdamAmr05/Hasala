import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { authApi, createApiClient } from '@hasala/shared';
import { authStore } from '../store/authStore';
import { API_BASE_URL } from '../config';

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register';

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
    const [mode, setMode] = useState<AuthMode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Initialize API client
    React.useEffect(() => {
        createApiClient({
            baseURL: API_BASE_URL,
            getAuthToken: () => authStore.getToken(),
        });
    }, []);

    const authMutation = useMutation({
        mutationFn: async () => {
            if (mode === 'login') {
                return authApi.login({ email: email.trim(), password });
            }
            return authApi.register({ name: name.trim(), email: email.trim(), password });
        },
        onSuccess: async (data) => {
            console.log('🔐 Login success! Data received:', {
                _id: data._id,
                name: data.name,
                hasToken: !!data.token,
                tokenPreview: data.token ? data.token.substring(0, 20) + '...' : 'NO TOKEN!'
            });

            // Store token for mobile authentication
            if (data.token) {
                await authStore.setToken(data.token);
                console.log('✅ Token stored successfully');
            } else {
                console.log('⚠️ NO TOKEN in response - auth will fail!');
            }
            // Store user data
            await authStore.setUser({
                id: data._id,
                name: data.name,
                email: data.email,
                budget: data.budget,
            });
            setError(null);
            onLoginSuccess();
        },
        onError: () => {
            setError('Authentication failed. Please check your details.');
        },
    });

    const handleSubmit = () => {
        // Basic validation
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (mode === 'register' && name.trim().length < 2) {
            setError('Name must be at least 2 characters.');
            return;
        }
        authMutation.mutate();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.form}>
                <View style={styles.header}>
                    <Text style={styles.subtitle}>
                        {mode === 'login' ? 'Login' : 'Create Account'}
                    </Text>
                    <Text style={styles.title}>
                        {mode === 'login' ? 'Welcome to Hasala' : 'Join Hasala'}
                    </Text>
                    <Text style={styles.description}>
                        Frictionless money tracking built for Egyptian students.
                    </Text>
                </View>

                {mode === 'register' && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Youssef Hassan"
                            placeholderTextColor="#6B6B6B"
                            autoCapitalize="words"
                        />
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="student@university.edu"
                        placeholderTextColor="#6B6B6B"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Minimum 6 characters"
                        placeholderTextColor="#6B6B6B"
                        secureTextEntry={true}
                    />
                </View>

                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.button, authMutation.isPending && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={authMutation.isPending}
                >
                    {authMutation.isPending ? (
                        <ActivityIndicator color="#007AFF" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {mode === 'login' ? 'Log into Hasala' : 'Create Account'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.switchMode}
                    onPress={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError(null);
                    }}
                >
                    <Text style={styles.switchModeText}>
                        {mode === 'login' ? "No account yet? " : "Already have an account? "}
                        <Text style={styles.switchModeLink}>
                            {mode === 'login' ? 'Register' : 'Sign in'}
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0F',
        justifyContent: 'center',
        padding: 24,
    },
    form: {
        backgroundColor: '#1C1C1E',
        borderRadius: 24,
        padding: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 3,
        color: '#6B6B6B',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#6B6B6B',
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 2,
        color: '#6B6B6B',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2C2C2E',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    errorBox: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    switchMode: {
        alignItems: 'center',
    },
    switchModeText: {
        fontSize: 12,
        color: '#6B6B6B',
    },
    switchModeLink: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});
