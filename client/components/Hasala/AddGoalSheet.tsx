import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, PiggyBank } from 'lucide-react';
import { savingsApi, SavingsGoal } from '../../services/api';
import { AVAILABLE_ICONS, getIcon } from '../../utils/icons';

interface AddGoalSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onGoalAdded: () => void;
    goal?: SavingsGoal; // Optional goal for editing
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6', '#FF2D55', '#5AC8FA'];

const AddGoalSheet: React.FC<AddGoalSheetProps> = ({ isOpen, onClose, onGoalAdded, goal }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form when goal changes or sheet opens
    useEffect(() => {
        if (goal) {
            setName(goal.name);
            setAmount(goal.targetAmount.toString());
            setSelectedColor(goal.color);
            setSelectedIcon(goal.icon);
        } else {
            setName('');
            setAmount('');
            setSelectedColor(COLORS[0]);
            setSelectedIcon(AVAILABLE_ICONS[0]);
        }
    }, [goal, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount) return;

        setIsSubmitting(true);
        try {
            if (goal) {
                await savingsApi.update(goal._id, {
                    name,
                    targetAmount: Number(amount),
                    color: selectedColor,
                    icon: selectedIcon,
                });
            } else {
                await savingsApi.create({
                    name,
                    targetAmount: Number(amount),
                    color: selectedColor,
                    icon: selectedIcon,
                });
            }
            onGoalAdded();
            onClose();
        } catch (error) {
            console.error('Failed to save goal', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1C1C1E] rounded-t-[32px] p-6 z-50 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8" />

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <PiggyBank className="text-primary" size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {goal ? 'Edit Goal' : 'New Goal'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Goal Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. New Laptop"
                                    className="w-full bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl p-4 text-lg font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    autoFocus={!goal}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Target Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl p-4 text-lg font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">EGP</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Icon</label>
                                <div className="flex gap-3 overflow-x-auto p-4 -mx-4 no-scrollbar px-6">
                                    {AVAILABLE_ICONS.map((iconName) => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setSelectedIcon(iconName)}
                                            className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedIcon === iconName
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                                : 'bg-gray-50 dark:bg-[#2C2C2E] text-gray-500 hover:bg-gray-100 dark:hover:bg-[#3A3A3C]'
                                                }`}
                                        >
                                            {getIcon(iconName, { size: 24 })}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color</label>
                                <div className="flex gap-3 overflow-x-auto p-4 -mx-4 no-scrollbar px-6">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setSelectedColor(color)}
                                            className={`flex-shrink-0 w-12 h-12 rounded-full transition-all flex items-center justify-center ${selectedColor === color ? 'scale-110 ring-4 ring-offset-2 dark:ring-offset-[#1C1C1E]' : 'hover:scale-105'
                                                }`}
                                            style={{
                                                backgroundColor: color,
                                                boxShadow: selectedColor === color ? `0 0 20px ${color}66` : 'none',
                                                borderColor: selectedColor === color ? 'transparent' : 'transparent'
                                            }}
                                        >
                                            {selectedColor === color && <Check size={20} className="text-white drop-shadow-md" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!name || !amount || isSubmitting}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] hover:bg-blue-600 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={20} />
                                        {goal ? 'Save Changes' : 'Create Goal'}
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddGoalSheet;
