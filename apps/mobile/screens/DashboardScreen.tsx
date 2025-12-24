import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi, Transaction, TransactionType, Category } from '@hasala/shared';

const CATEGORY_EMOJI: Record<string, string> = {
    Food: '🍔',
    Transport: '🚗',
    Entertainment: '🎬',
    Shopping: '🛍️',
    Bills: '💡',
    Education: '📚',
    Income: '💰',
    Salary: '💵',
    Giving: '🎁',
    Housing: '🏠',
    Other: '📦',
};

function formatCurrency(amount: number): string {
    return `EGP ${Math.abs(amount).toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function TransactionItem({ item }: { item: Transaction }) {
    const isExpense = item.type === TransactionType.EXPENSE;
    return (
        <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
                <Text style={styles.transactionEmoji}>
                    {CATEGORY_EMOJI[item.category] || '📦'}
                </Text>
            </View>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription} numberOfLines={1}>
                    {item.description}
                </Text>
                <Text style={styles.transactionCategory}>{item.category}</Text>
            </View>
            <Text style={[styles.transactionAmount, isExpense ? styles.expense : styles.income]}>
                {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
            </Text>
        </View>
    );
}

export default function DashboardScreen() {
    const currentDate = new Date();

    const { data, isLoading, refetch, isRefetching, error } = useQuery({
        queryKey: ['transactions', currentDate.getMonth(), currentDate.getFullYear()],
        queryFn: async () => {
            // Note: getMonth() returns 0-11, which is what the server expects
            console.log('📡 Fetching transactions for month:', currentDate.getMonth(), 'year:', currentDate.getFullYear());
            try {
                const result = await transactionsApi.list({
                    month: currentDate.getMonth(), // 0-11 format to match server
                    year: currentDate.getFullYear(),
                    limit: 50,
                });
                console.log('✅ Got transactions:', result.data.length);
                return result;
            } catch (err: any) {
                console.log('❌ Transactions error:', err.message, err.response?.status, err.response?.data);
                throw err;
            }
        },
    });

    // Debug logging
    console.log('🏠 Dashboard render - isLoading:', isLoading, 'data:', data?.data?.length, 'error:', error?.message);

    const transactions = data?.data ?? [];

    // Calculate totals
    const totals = transactions.reduce(
        (acc, tx) => {
            if (tx.type === TransactionType.EXPENSE) {
                acc.expense += tx.amount;
            } else {
                acc.income += tx.amount;
            }
            return acc;
        },
        { income: 0, expense: 0 }
    );

    const balance = totals.income - totals.expense;

    return (
        <View style={styles.container}>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>This Month</Text>
                <Text style={styles.balanceAmount}>
                    {formatCurrency(balance)}
                </Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Income</Text>
                        <Text style={[styles.summaryValue, styles.income]}>
                            +{formatCurrency(totals.income)}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Expenses</Text>
                        <Text style={[styles.summaryValue, styles.expense]}>
                            -{formatCurrency(totals.expense)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Transactions List */}
            <View style={styles.transactionsSection}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TransactionItem item={item} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor="#FFFFFF"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>
                                {isLoading ? 'Loading...' : 'No transactions yet'}
                            </Text>
                        </View>
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={transactions.length === 0 ? styles.emptyContainer : undefined}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0F',
    },
    summaryCard: {
        backgroundColor: '#1C1C1E',
        margin: 16,
        borderRadius: 20,
        padding: 24,
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
        color: '#6B6B6B',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6B6B6B',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '600',
    },
    income: {
        color: '#34C759',
    },
    expense: {
        color: '#FF3B30',
    },
    transactionsSection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
    },
    transactionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#2C2C2E',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionEmoji: {
        fontSize: 20,
    },
    transactionDetails: {
        flex: 1,
        marginRight: 12,
    },
    transactionDescription: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    transactionCategory: {
        fontSize: 13,
        color: '#6B6B6B',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#6B6B6B',
    },
    emptyContainer: {
        flex: 1,
    },
});
