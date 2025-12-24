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

    // Session-based state for robust "handoff" animation
    // We track the total local change relative to the "frozen" base amount
    type Session = {
        baseAmount: number;      // The server amount when interaction started
        localTotalDelta: number; // Total change applied by user in this session
        syncedTotalDelta: number;// Total change that has been successfully sent to server
    };
    const [sessions, setSessions] = useState<Record<string, Session>>({});
    const sessionsRef = React.useRef<Record<string, Session>>({});
    const debounceTimers = React.useRef<Record<string, NodeJS.Timeout>>({});

    const queryClient = useQueryClient();

    const { data: goals, isLoading } = useQuery({
        queryKey: ['savingsGoals'],
        queryFn: savingsApi.list,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, delta }: { id: string; delta: number }) =>
            savingsApi.update(id, { delta }),
        onSuccess: (updatedGoal, variables) => {
            // 1. Update Cache with authoritative data
            queryClient.setQueryData<SavingsGoal[]>(['savingsGoals'], (old) =>
                old?.map((g) => (g._id === updatedGoal._id ? updatedGoal : g))
            );

            // 2. Manage Session Handoff
            setSessions(prev => {
                const session = prev[updatedGoal._id];
                if (!session) return prev;

                // If user hasn't clicked more since we sent this request
                // (i.e., localTotalDelta matches the syncedTotalDelta we just finished)
                // Then we can safely end the session and switch to server data.
                if (session.localTotalDelta === session.syncedTotalDelta) {
                    const next = { ...prev };
                    delete next[updatedGoal._id];
                    return next;
                }

                // If user clicked more, keep session alive.
                // The next debounce flush will handle the remaining delta.
                return prev;
            });
        },
        onError: (err, variables) => {
            // On error, we might want to revert the synced status or show error
            // For now, we keep the session so user doesn't lose their local state visual
            console.error("Failed to sync savings update", err);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: savingsApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['savingsGoals'] });
        },
    });

    const handleUpdate = (id: string, step: number) => {
        // 1. Get or Initialize Session
        setSessions(prev => {
            const currentSession = prev[id] || {
                baseAmount: goals?.find(g => g._id === id)?.currentAmount || 0,
                localTotalDelta: 0,
                syncedTotalDelta: 0
            };

            const newSession = {
                ...currentSession,
                localTotalDelta: currentSession.localTotalDelta + step
            };

            // Keep ref in sync for timer access
            sessionsRef.current[id] = newSession;

            return { ...prev, [id]: newSession };
        });

        // 2. Debounce Network Sync
        if (debounceTimers.current[id]) {
            clearTimeout(debounceTimers.current[id]);
        }

        debounceTimers.current[id] = setTimeout(() => {
            const session = sessionsRef.current[id];
            if (!session) return;

            // Calculate what needs to be sent
            const deltaToSend = session.localTotalDelta - session.syncedTotalDelta;

            if (deltaToSend !== 0) {
                // Mark as syncing
                setSessions(prev => {
                    const s = prev[id];
                    if (!s) return prev;
                    const updated = { ...s, syncedTotalDelta: s.localTotalDelta };
                    sessionsRef.current[id] = updated;
                    return { ...prev, [id]: updated };
                });

                updateMutation.mutate({ id, delta: deltaToSend });
            }

            delete debounceTimers.current[id];
        }, 500);
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const handleEdit = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setIsAddSheetOpen(true);
    };

    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeouts on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    const handleCloseSheet = () => {
        setIsAddSheetOpen(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setEditingGoal(undefined), 300); // Clear after animation
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
                            {goals.map((goal) => {
                                // Robust Display Logic:
                                // If we have an active session, use (FrozenBase + LocalTotalDelta)
                                // Otherwise, use the server's currentAmount
                                const session = sessions[goal._id];
                                const displayAmount = session
                                    ? Math.max(0, session.baseAmount + session.localTotalDelta)
                                    : goal.currentAmount;

                                const displayGoal = {
                                    ...goal,
                                    currentAmount: displayAmount
                                };

                                return (
                                    <GoalCard
                                        key={goal._id}
                                        goal={displayGoal}
                                        onUpdate={(amount) => handleUpdate(goal._id, amount)}
                                        onEdit={() => handleEdit(goal)}
                                        onDelete={() => handleDelete(goal._id)}
                                    />
                                );
                            })}
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
