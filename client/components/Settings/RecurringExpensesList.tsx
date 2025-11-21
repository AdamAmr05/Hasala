import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringApi, Category } from '../../services/api';
import { Trash2, Plus, Calendar, AlertCircle, History } from 'lucide-react';

const RecurringExpensesList: React.FC = () => {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        description: '',
        category: Category.BILLS,
        dayOfMonth: '1',
    });

    const { data: expenses, isLoading, isError } = useQuery({
        queryKey: ['recurringExpenses'],
        queryFn: recurringApi.getAll,
    });

    const createMutation = useMutation({
        mutationFn: recurringApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
            setIsAdding(false);
            setNewExpense({ amount: '', description: '', category: Category.BILLS, dayOfMonth: '1' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: recurringApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] });
        },
    });

    const resetMutation = useMutation({
        mutationFn: (id: string) => recurringApi.resetLastInjected(id),
        onSuccess: () => {
            alert('Rewound! Go to dashboard to trigger injection.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate({
            amount: Number(newExpense.amount),
            description: newExpense.description,
            category: newExpense.category,
            dayOfMonth: Number(newExpense.dayOfMonth),
        });
    };

    if (isLoading) return <div className="p-4 text-center text-gray-500">Loading rules...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Failed to load recurring expenses.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Recurring Expenses</h3>
                    <p className="text-xs text-gray-500">Bills that auto-log when you visit.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                        <input
                            type="text"
                            value={newExpense.description}
                            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                            className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                            placeholder="Netflix, Rent..."
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Amount</label>
                            <input
                                type="number"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Day of Month</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                value={newExpense.dayOfMonth}
                                onChange={(e) => setNewExpense({ ...newExpense, dayOfMonth: e.target.value })}
                                className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                        <select
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as Category })}
                            className="w-full mt-1 p-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
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
                            className="px-4 py-2 text-gray-500 text-sm hover:bg-gray-50 rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-600 disabled:opacity-50"
                        >
                            {createMutation.isPending ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {expenses?.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                        <Calendar size={32} className="opacity-20" />
                        <p className="text-sm">No recurring expenses set.</p>
                    </div>
                )}

                {expenses?.map((expense) => (
                    <div key={expense._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-xs">
                                {expense.dayOfMonth}
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                                <p className="text-xs text-gray-500">{expense.amount.toLocaleString()} EGP • {expense.category}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => resetMutation.mutate(expense._id)}
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                title="Test: Rewind 1 Month"
                            >
                                <History size={18} />
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(expense._id)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>How it works:</strong> We don't charge you automatically. Instead, whenever you open the app, we check if a bill was due and log it for you retroactively.
                </p>
            </div>
        </div>
    );
};

export default RecurringExpensesList;
