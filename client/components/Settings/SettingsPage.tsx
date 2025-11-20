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

interface SettingsPageProps {
    user: { name: string; email: string; avatar?: string; budget?: number } | null;
    onLogout: () => void;
    onBack?: () => void; // Optional now
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const [budget, setBudget] = useState(user?.budget?.toString() || '0');
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const queryClient = useQueryClient();

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
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="text-gray-600" size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>

            <motion.div
                className="p-6 space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Profile Section */}
                <motion.div variants={itemVariants} className="flex flex-col items-center py-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
                        {user?.name?.[0] || 'H'}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h2>
                    {/* Email hidden as requested */}
                </motion.div>

                {/* Budget Goal Section */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Monthly Goal</h3>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <CreditCard size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Budget Limit</h4>
                                    <p className="text-xs text-gray-500">Your monthly spending target</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">EGP</span>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => {
                                        setBudget(e.target.value);
                                        setIsEditingBudget(true);
                                    }}
                                    className="w-full pl-14 pr-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            {isEditingBudget && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={handleSaveBudget}
                                    disabled={updateProfileMutation.isPending}
                                    className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-600 transition-colors"
                                >
                                    <Save size={20} />
                                </motion.button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Family Sync (Placeholder) */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Family & Household</h3>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-accent-blue/10 text-accent-blue text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                            COMING SOON
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-accent-blue">
                                <Users size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">Family Sync</h4>
                                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                                    Coordinate spending with your household without sharing everything.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Preferences */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Preferences</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">

                        {/* Language */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <Globe size={20} />
                                </div>
                                <span className="font-medium text-gray-700">Language</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <span>English</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <Moon size={20} />
                                </div>
                                <span className="font-medium text-gray-700">Dark Mode</span>
                            </div>
                            <div className="w-11 h-6 bg-gray-200 rounded-full relative cursor-not-allowed">
                                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm" />
                            </div>
                        </div>

                    </div>
                </motion.div>

                {/* Security & Privacy */}
                <motion.div variants={itemVariants}>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Security</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <Shield size={20} />
                                </div>
                                <span className="font-medium text-gray-700">Privacy & Data</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                        </div>
                    </div>
                </motion.div>

                {/* Logout */}
                <motion.div variants={itemVariants} className="pt-4">
                    <button
                        onClick={onLogout}
                        className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                    >
                        <LogOut size={20} />
                        Log Out
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        Hasala v1.0.0 (Beta)
                    </p>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default SettingsPage;
