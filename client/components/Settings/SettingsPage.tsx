import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    LogOut,
    Users,
    Globe,
    Moon,
    CreditCard,
    ChevronRight,
    Shield,
    Save
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import RecurringExpensesList from './RecurringExpensesList';
import { useTheme } from '../../context/ThemeContext';

interface SettingsPageProps {
    user: { name: string; email: string; avatar?: string; budget?: number } | null;
    onLogout: () => void;
    onBack?: () => void; // Optional now
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onLogout, onBack }) => {
    const navigate = useNavigate();
    const [budget, setBudget] = useState(user?.budget?.toString() || '0');
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const queryClient = useQueryClient();
    const { isDark, toggleTheme } = useTheme();

    const updateProfileMutation = useMutation({
        mutationFn: authApi.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            setIsEditingBudget(false);
        }
    });

    const handleSaveBudget = () => {
        const newBudget = parseFloat(budget);
        if (!isNaN(newBudget)) {
            updateProfileMutation.mutate({ budget: newBudget });
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#0D0D0F] pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-[#1C1C1E] px-6 pt-12 pb-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm dark:shadow-none dark:border-b dark:border-[#2C2C2E]">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"
                >
                    <ChevronLeft className="text-gray-600 dark:text-gray-300" size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>

            <motion.div
                className="p-6 space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Profile Section */}
                <motion.div variants={itemVariants} className="flex flex-col items-center py-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary dark:from-white to-accent-blue dark:to-gray-300 flex items-center justify-center text-white dark:text-primary text-3xl font-bold shadow-lg mb-4">
                        {user?.name?.[0] || 'H'}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name || 'User'}</h2>
                    {/* Email hidden as requested */}
                </motion.div>

                {/* Budget Goal Section */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-1">Monthly Goal</h3>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-lg">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">Budget Limit</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Your monthly spending target</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-bold">EGP</span>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => {
                                        setBudget(e.target.value);
                                        setIsEditingBudget(true);
                                    }}
                                    className="w-full pl-14 pr-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] dark:text-white rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 dark:focus:ring-accent-blue/20 focus:border-primary dark:focus:border-accent-blue outline-none transition-all"
                                />
                            </div>
                            {isEditingBudget && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={handleSaveBudget}
                                    disabled={updateProfileMutation.isPending}
                                    className="p-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl shadow-lg shadow-primary/30 dark:shadow-white/20 hover:bg-blue-600 dark:hover:bg-gray-200 transition-colors"
                                >
                                    <Save size={20} />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Recurring Expenses Section */}
                <motion.div variants={itemVariants}>
                    <RecurringExpensesList />
                </motion.div>

                {/* Family Sync (Placeholder) */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-1">Family & Household</h3>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2C2C2E] relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-accent-blue/10 text-accent-blue text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                            COMING SOON
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-white/10 rounded-xl text-accent-blue dark:text-white">
                                <Users size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Family Sync</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Coordinate spending with your household without sharing everything.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Preferences */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-1">Preferences</h3>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2C2C2E] divide-y divide-gray-50 dark:divide-[#2C2C2E]">

                        {/* Language */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-lg text-gray-600 dark:text-gray-300">
                                    <Globe size={20} />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-200">Language</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
                                <span>English</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            className="p-4 flex items-center justify-between w-full"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-lg text-gray-600 dark:text-gray-300">
                                    <Moon size={20} />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
                            </div>
                            <div className={`w-11 h-6 rounded-full relative transition-colors ${isDark ? 'bg-white' : 'bg-gray-200'}`}>
                                <motion.div 
                                    className={`w-5 h-5 rounded-full absolute top-0.5 shadow-sm ${isDark ? 'bg-primary' : 'bg-white'}`}
                                    animate={{ left: isDark ? '22px' : '2px' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                />
                            </div>
                        </button>

                    </div>
                </motion.div>

                {/* Security & Privacy */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 ml-1">Security</h3>
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-lg text-gray-600 dark:text-gray-300">
                                    <Shield size={20} />
                                </div>
                                <span className="font-medium text-gray-700 dark:text-gray-200">Privacy & Data</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>
                </motion.div>

                {/* Logout */}
                <motion.div variants={itemVariants} className="pt-4">
                    <button
                        onClick={onLogout}
                        className="w-full py-4 bg-red-50 dark:bg-red-500/10 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                        <LogOut size={20} />
                        Log Out
                    </button>
                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                        Hasala v1.0.0 (Beta)
                    </p>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default SettingsPage;
