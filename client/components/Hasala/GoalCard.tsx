import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Target, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { SavingsGoal } from '../../services/api';
import { getIcon } from '../../utils/icons';

interface GoalCardProps {
    goal: SavingsGoal;
    onUpdate: (delta: number) => void;
    onEdit: () => void;
    onDelete: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdate, onEdit, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showError, setShowError] = useState(false);
    const percentage = goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (goal.currentAmount >= goal.targetAmount) {
            setShowError(true);
            setTimeout(() => setShowError(false), 2000);
            return;
        }
        onUpdate(100);
    };

    const handleSubtract = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (goal.currentAmount <= 0) return;
        onUpdate(-100);
    };

    // Helper to convert hex to rgba for the gradient
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden bg-white dark:bg-[#1C1C1E] rounded-[32px] p-6 shadow-sm group select-none"
        >
            {/* Background Progress Fill */}
            <div className="absolute inset-0 bg-gray-50 dark:bg-[#2C2C2E] z-0">
                <motion.div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                        background: `linear-gradient(to top, ${hexToRgba(goal.color, 0.2)}, transparent)`
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#3A3A3C] shadow-sm flex items-center justify-center text-2xl border border-gray-100 dark:border-transparent">
                        {getIcon(goal.icon, { size: 24, style: { color: goal.color } })}
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="flex flex-col items-end">
                            <AnimatePresence mode="wait">
                                {showError ? (
                                    <motion.span
                                        key="error"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="text-xs font-bold text-red-500 uppercase tracking-wider"
                                    >
                                        Goal Reached!
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="label"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                                    >
                                        Target
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{goal.targetAmount.toLocaleString()}</span>
                        </div>

                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-[#48484A] transition-colors"
                            >
                                <MoreHorizontal size={16} />
                            </button>

                            <AnimatePresence>
                                {showMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-20"
                                            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                            className="absolute right-0 top-10 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-xl border border-gray-100 dark:border-[#3A3A3C] p-2 z-30 min-w-[120px] flex flex-col gap-1"
                                        >
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#3A3A3C] text-sm font-medium text-gray-700 dark:text-gray-200 w-full text-left"
                                            >
                                                <Edit2 size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium text-red-500 w-full text-left"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{goal.name}</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            {goal.currentAmount.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-gray-400 dark:text-gray-500">EGP</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full bg-gray-200 dark:bg-[#3A3A3C] rounded-full overflow-hidden mb-4">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: goal.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    />
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between gap-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSubtract}
                        className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                        <Minus size={24} />
                    </motion.button>

                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        {percentage.toFixed(0)}%
                    </span>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleAdd}
                        className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-[#48484A] transition-colors"
                        style={{ color: goal.color, backgroundColor: `${goal.color}1A` }}
                    >
                        <Plus size={24} />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default GoalCard;
