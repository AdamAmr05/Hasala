import React from 'react';
import { motion } from 'framer-motion';
import { PiggyBank, Target, Smartphone, Plane, Car, Home, Laptop, Gift, Wallet } from 'lucide-react';

interface SavingsGoal {
    name: string;
    current: number;
    target: number;
    progress: number;
    color: string;
    icon: string;
}

interface SavingsOverviewProps {
    data?: {
        totalSaved: number;
        totalTarget: number;
        overallProgress: number;
        topGoals: SavingsGoal[];
    };
}

const getGoalIcon = (icon: string, name: string) => {
    const lowerName = name.toLowerCase();
    const lowerIcon = icon.toLowerCase();

    // 1. Check for specific keywords in name or icon
    if (lowerName.includes('phone') || lowerIcon.includes('phone')) return <Smartphone size={18} />;
    if (lowerName.includes('trip') || lowerName.includes('travel') || lowerIcon.includes('plane')) return <Plane size={18} />;
    if (lowerName.includes('car') || lowerIcon.includes('car')) return <Car size={18} />;
    if (lowerName.includes('home') || lowerName.includes('house') || lowerIcon.includes('home')) return <Home size={18} />;
    if (lowerName.includes('laptop') || lowerName.includes('computer')) return <Laptop size={18} />;
    if (lowerName.includes('gift')) return <Gift size={18} />;

    // 2. Check if icon is a single emoji (basic check)
    if (/\p{Emoji}/u.test(icon) && icon.length <= 2) return <span className="text-lg">{icon}</span>;

    // 3. Fallback
    return <Target size={18} />;
};

const SavingsOverview: React.FC<SavingsOverviewProps> = ({ data }) => {
    if (!data) return null;

    const { totalSaved, totalTarget, overallProgress, topGoals } = data;

    // Safe numeric formatting helper
    const safeFormat = (val: any) => (Number.isFinite(Number(val)) ? Number(val).toLocaleString() : '0');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 my-3 shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                        <PiggyBank size={20} className="text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Savings Overview</h3>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            You've saved <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Math.round(overallProgress)}%</span> of your goals
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Stats Card */}
            <div className="relative overflow-hidden rounded-[24px] p-6 mb-6 bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-lg shadow-emerald-500/20 group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>

                <div className="relative z-10 flex justify-between items-center">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest opacity-80">Total Saved</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold tracking-tight">{safeFormat(totalSaved)}</span>
                            <span className="text-sm font-medium text-emerald-100">EGP</span>
                        </div>
                        <p className="text-[11px] font-medium text-emerald-50/80">
                            of {safeFormat(totalTarget)} EGP goal
                        </p>
                    </div>

                    {/* Progress Ring */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="26"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                className="text-black/10"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="26"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={163.3}
                                strokeDashoffset={163.3 - (163.3 * overallProgress) / 100}
                                className="text-white transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{Math.round(overallProgress)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Goals List */}
            <div className="space-y-5">
                <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-1">Top Goals</h4>
                {topGoals.length > 0 ? (
                    topGoals.map((goal: any, index: number) => (
                        <div key={index} className="group">
                            <div className="flex justify-between items-center mb-2.5">
                                <div className="flex items-center gap-3.5">
                                    <div
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 transition-transform group-hover:scale-105 duration-300"
                                        style={{ backgroundColor: goal.color + '15', color: goal.color }}
                                    >
                                        {getGoalIcon(goal.icon, goal.name)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-0.5">{goal.name}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                            <span className="text-gray-900 dark:text-gray-200 font-bold">{safeFormat(goal.current)}</span>
                                            <span className="mx-1 opacity-50">/</span>
                                            {safeFormat(goal.target)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold block" style={{ color: goal.color }}>{Math.round(goal.progress)}%</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-gray-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${goal.progress}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    className="h-full rounded-full shadow-sm"
                                    style={{ backgroundColor: goal.color }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 bg-gray-50 dark:bg-[#2C2C2E]/50 rounded-2xl border border-dashed border-gray-200 dark:border-[#3A3A3C]">
                        <p className="text-xs text-gray-400 font-medium">No active goals found.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SavingsOverview;
