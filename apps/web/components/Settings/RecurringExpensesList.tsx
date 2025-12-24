import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringApi, Category, TransactionType } from '../../services/api';
import { Trash2, Plus, Calendar, AlertCircle } from 'lucide-react';

const RecurringTransactionsList: React.FC = () => {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newTransaction, setNewTransaction] = useState({
        amount: '',
        description: '',
        category: Category.BILLS,
        type: TransactionType.EXPENSE,
        dayOfMonth: '1',
    });

    const { data: transactions, isLoading, isError } = useQuery({
        queryKey: ['recurringTransactions'],
        queryFn: recurringApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: recurringApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
            setIsAdding(false);
            setNewTransaction({
                amount: '',
                description: '',
                category: Category.BILLS,
                type: TransactionType.EXPENSE,
                dayOfMonth: '1'
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: recurringApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
        },
    });

    const rewindMutation = useMutation({
        mutationFn: recurringApi.rewind,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
            alert('Rewound! Refresh the page (or go to Home) to trigger injection.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            amount: Number(newTransaction.amount),
            description: newTransaction.description,
            category: newTransaction.category,
            type: newTransaction.type,
            dayOfMonth: Number(newTransaction.dayOfMonth),
        });
    };

    if (isLoading) return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading rules...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Failed to load recurring transactions.</div>;

    const incomeTransactions = transactions?.filter(t => t.type === TransactionType.INCOME) || [];
    const expenseTransactions = transactions?.filter(t => t.type === TransactionType.EXPENSE) || [];

    const renderList = (items: typeof transactions, title: string, emptyMsg: string) => (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mt-6 mb-2">{title}</h4>
            {items?.length === 0 && (
                <div className="text-center py-4 text-gray-400 dark:text-gray-500 flex flex-col items-center gap-2">
                    <p className="text-xs">{emptyMsg}</p>
                </div>
            )}
            {items?.map((item) => (
                <div key={item._id} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${item.type === TransactionType.INCOME ? 'bg-green-50 dark:bg-green-500/10 text-green-600' : 'bg-red-50 dark:bg-red-500/10 text-red-600'}`}>
                            {item.dayOfMonth}
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{item.description}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.amount.toLocaleString()} EGP • {item.category}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={() => rewindMutation.mutate(item._id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors"
                            title="Rewind 1 Month (Test)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        </button>
                        <button
                            onClick={() => deleteMutation.mutate(item._id)}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recurring Rules</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Auto-log salaries and bills.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 bg-primary/10 dark:bg-white/10 text-primary dark:text-white rounded-full hover:bg-primary/20 dark:hover:bg-white/20 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-[#2C2C2E] space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#2C2C2E] rounded-xl">
                        <button
                            type="button"
                            onClick={() => setNewTransaction({ ...newTransaction, type: TransactionType.EXPENSE, category: Category.BILLS })}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newTransaction.type === TransactionType.EXPENSE ? 'bg-white dark:bg-[#3A3A3C] shadow-sm text-red-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewTransaction({ ...newTransaction, type: TransactionType.INCOME, category: Category.SALARY })}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newTransaction.type === TransactionType.INCOME ? 'bg-white dark:bg-[#3A3A3C] shadow-sm text-green-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Income
                        </button>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                        <input
                            type="text"
                            value={newTransaction.description}
                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                            className="w-full mt-1 p-2 border border-gray-200 dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-white rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-accent-blue"
                            placeholder={newTransaction.type === TransactionType.INCOME ? "Salary, Allowance..." : "Netflix, Rent..."}
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</label>
                            <input
                                type="number"
                                value={newTransaction.amount}
                                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                                className="w-full mt-1 p-2 border border-gray-200 dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-white rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-accent-blue"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Day of Month</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={newTransaction.dayOfMonth}
                                onChange={(e) => setNewTransaction({ ...newTransaction, dayOfMonth: e.target.value })}
                                className="w-full mt-1 p-2 border border-gray-200 dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-white rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-accent-blue"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Category</label>
                        <select
                            value={newTransaction.category}
                            onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value as Category })}
                            className="w-full mt-1 p-2 border border-gray-200 dark:border-[#3A3A3C] dark:bg-[#2C2C2E] dark:text-white rounded-xl text-sm focus:outline-none focus:border-primary dark:focus:border-accent-blue"
                        >
                            {Object.values(Category).map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-[#2C2C2E] rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="px-4 py-2 bg-primary dark:bg-white text-white dark:text-primary text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-600 dark:hover:bg-gray-200 disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </form>
            )}

            {renderList(incomeTransactions, 'Recurring Income', 'No recurring income set.')}
            {renderList(expenseTransactions, 'Recurring Expenses', 'No recurring expenses set.')}

            <div className="bg-blue-50 dark:bg-white/10 p-4 rounded-2xl flex gap-3 items-start mt-6">
                <AlertCircle className="text-blue-500 dark:text-white shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-700 dark:text-gray-300 leading-relaxed">
                    <strong>How it works:</strong> We check for due items whenever you open the app and log them automatically.
                </p>
            </div>
        </div>
    );
};

export default RecurringTransactionsList;
