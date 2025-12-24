import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { authStore, StoredUser } from '../store/authStore';
import { authApi } from '@hasala/shared';

interface SettingsScreenProps {
    user: StoredUser | null;
    onLogout: () => void;
}

export default function SettingsScreen({ user, onLogout }: SettingsScreenProps) {
    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authApi.logout();
                        } catch {
                            // Ignore logout API errors
                        }
                        await authStore.clear();
                        onLogout();
                    },
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Profile Section */}
            <View style={styles.section}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name?.charAt(0).toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                    </View>
                </View>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Edit Profile</Text>
                        <Text style={styles.menuItemArrow}>›</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Budget Settings</Text>
                        <Text style={styles.menuItemArrow}>›</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Recurring Transactions</Text>
                        <Text style={styles.menuItemArrow}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* App Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Notifications</Text>
                        <Text style={styles.menuItemArrow}>›</Text>
                    </TouchableOpacity>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.menuItem}>
                        <Text style={styles.menuItemText}>Appearance</Text>
                        <Text style={styles.menuItemArrow}>›</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logout */}
            <View style={styles.section}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Hasala v1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0F',
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
        color: '#6B6B6B',
        textTransform: 'uppercase',
        marginBottom: 12,
        marginLeft: 4,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6B6B6B',
    },
    card: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    menuItemText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    menuItemArrow: {
        fontSize: 20,
        color: '#6B6B6B',
    },
    separator: {
        height: 1,
        backgroundColor: '#2C2C2E',
        marginLeft: 16,
    },
    logoutButton: {
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    footerText: {
        fontSize: 12,
        color: '#6B6B6B',
    },
});
