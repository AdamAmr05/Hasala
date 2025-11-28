import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PiggyBank } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { savingsApi, SavingsGoal } from '../../services/api';
import GoalCard from './GoalCard';
import AddGoalSheet from './AddGoalSheet';

const HasalaPage: React.FC = () => {
    const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>(undefined);
    const queryClient = useQueryClient();

    const { data: goals, isLoading } = useQuery({
        queryKey: ['savingsGoals'],
        queryFn: savingsApi.list,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, delta }: { id: string; delta: number }) =>
            savingsApi.update(id, { delta }),
        onMutate: async ({ id, delta }) => {
            await queryClient.cancelQueries({ queryKey: ['savingsGoals'] });
            const previousGoals = queryClient.getQueryData<SavingsGoal[]>(['savingsGoals']);

            queryClient.setQueryData<SavingsGoal[]>(['savingsGoals'], (old) =>
                old?.map((goal) =>
                    goal._id === id ? { ...goal, currentAmount: Math.max(0, goal.currentAmount + delta) } : goal
                )
            );

            return { previousGoals };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(['savingsGoals'], context?.previousGoals);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: savingsApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
        },
    });

    const handleUpdate = (id: string, delta: number) => {
        updateMutation.mutate({ id, delta });
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleEdit = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setIsAddSheetOpen(true);
    };

    const handleCloseSheet = () => {
        setIsAddSheetOpen(false);
        setTimeout(() => setEditingGoal(undefined), 300); // Clear after animation
    };

    return (
        <div className="min-h-screen pb-32 pt-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="px-6 mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">Hasala</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Your savings jar.</p>
                </div>
                <button
                    onClick={() => setIsAddSheetOpen(true)}
                    className="w-10 h-10 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 hover:bg-blue-600 transition-all"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="px-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : goals && goals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {goals.map((goal) => (
                                <GoalCard
                                    key={goal._id}
                                    goal={goal}
                                    onUpdate={(amount) => handleUpdate(goal._id, amount)}
                                    onEdit={() => handleEdit(goal)}
                                    onDelete={() => handleDelete(goal._id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-[#1C1C1E] flex items-center justify-center mb-4">
                            <PiggyBank size={48} className="text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Start Saving Today</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                            Create a goal to track your savings for the things you love.
                        </p>
                        <button
                            onClick={() => setIsAddSheetOpen(true)}
                            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 hover:scale-105 hover:bg-blue-600 transition-all"
                        >
                            Create First Goal
                        </button>
                    </div>
                )}
            </div>

            <AddGoalSheet
                isOpen={isAddSheetOpen}
                onClose={handleCloseSheet}
                onGoalAdded={() => {
                    queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
                }}
                goal={editingGoal}
            />
        </div>
    );
};

export default HasalaPage;
