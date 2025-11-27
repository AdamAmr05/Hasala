import React from 'react';
import { TrendingUp, ArrowDownCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface IncomeSource {
    name: string;
    value: number;
}

interface IncomeOverviewProps {
    incomeSources: IncomeSource[];
    totalIncome: number;
}

const IncomeOverview: React.FC<IncomeOverviewProps> = ({ incomeSources, totalIncome }) => {
    // Sort sources by value descending
    const sortedSources = [...incomeSources].sort((a, b) => b.value - a.value);

    return (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 shadow-sm border border-gray-100 dark:border-[#2C2C2E] w-full max-w-sm mx-auto my-2">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                    <ArrowDownCircle className="text-green-600 dark:text-green-500" size={20} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Total Income</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{totalIncome.toLocaleString()} EGP</p>
                </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-4">
                {sortedSources.map((source, index) => {
                    const percentage = totalIncome > 0 ? (source.value / totalIncome) * 100 : 0;

                    // Match AnalyticsView Colors (All Green)
                    const colorClass = 'bg-green-500';

                    return (
                        <div key={source.name} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{source.name}</span>
                                <span className="font-bold text-gray-900 dark:text-white">{source.value.toLocaleString()}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-gray-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className={`h-full rounded-full ${colorClass}`}
                                />
                            </div>
                        </div>
                    );
                })}

                {sortedSources.length === 0 && (
                    <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-2">No income recorded this month.</p>
                )}
            </div>
        </div>
    );
};

export default IncomeOverview;
