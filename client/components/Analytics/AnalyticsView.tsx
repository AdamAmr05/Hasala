import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { transactionsApi } from '../../services/api';
import { TrendingUp, Calendar, PieChart as PieIcon, Users, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FunEquivalents from './FunEquivalents';

const AnalyticsView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['analytics', month, year],
        queryFn: () => transactionsApi.getAnalytics(30, month, year, Intl.DateTimeFormat().resolvedOptions().timeZone),
        placeholderData: (previousData) => previousData,
    });

    const onPrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const onNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400 space-y-4">
                <AlertCircle size={32} className="text-red-500" />
                <p>Could not load analytics.</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Transform Data for Charts
    const trendData = data.dailyTrend.map(d => ({
        date: new Date(d._id).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        amount: d.total
    }));

    const categoryData = data.categoryBreakdown.map(c => ({
        name: c._id,
        value: c.total
    }));

    const peopleData = data.peopleBreakdown.map(p => ({
        name: p._id || 'Unknown',
        value: p.total
    }));

    // Day of week analysis (calculated from daily trend for now, or could be server-side)
    // For simplicity and consistency, let's calculate it from the daily trend which covers the period
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayTotals = new Array(7).fill(0);
    data.dailyTrend.forEach(d => {
        const dayIndex = new Date(d._id).getDay();
        dayTotals[dayIndex] += d.total;
    });
    const dayData = days.map((day, index) => ({ day, amount: dayTotals[index] }));


    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];

    // Calculate Total Expense for Fun Equivalents
    const totalExpense = data.totals.find(t => t._id === 'EXPENSE')?.total || 0;

    return (
        <div className="pb-32 pt-8 space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Header & Month Navigation */}
            <div className="px-6 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary dark:text-white tracking-tight">Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Deep dive into your spending habits.</p>
                </div>

                <div className="flex items-center justify-between bg-white dark:bg-[#1C1C1E] p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                    <button onClick={onPrevMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    <motion.h2
                        key={monthName}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-bold text-primary dark:text-white"
                    >
                        {monthName}
                    </motion.h2>
                    <button onClick={onNextMonth} className="p-2 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Fun Equivalents Section */}
            {totalExpense > 0 && (
                <FunEquivalents totalSpent={totalExpense} />
            )}

            {/* Income Overview Section */}
            {data.incomeBreakdown && data.incomeBreakdown.length > 0 && (
                <div className="px-6">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-full">
                                <TrendingUp size={18} className="text-green-500" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Income Sources</h3>
                        </div>

                        {/* Total Income Display */}
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.totals.find(t => t._id === 'INCOME')?.total.toLocaleString() || 0} <span className="text-sm text-gray-500 dark:text-gray-400">EGP</span>
                            </p>
                        </div>

                        {/* Income Breakdown */}
                        <div className="space-y-3">
                            {data.incomeBreakdown.map((source, index) => {
                                const totalIncome = data.totals.find(t => t._id === 'INCOME')?.total || 1;
                                const percentage = (source.total / totalIncome) * 100;

                                return (
                                    <div key={source._id} className="space-y-1">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium text-gray-700 dark:text-gray-200">{source._id}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{source.total.toLocaleString()} EGP</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2 w-full bg-gray-100 dark:bg-[#2C2C2E] rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                                className="h-full rounded-full bg-green-500"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* 0. People Section */}
            {peopleData.length > 0 && (
                <div className="px-6">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-full">
                                <Users size={18} className="text-indigo-500" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">People</h3>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                            {peopleData.map((person, index) => (
                                <div key={person.name} className="flex flex-col items-center space-y-2 min-w-[80px]">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md bg-gradient-to-br ${index === 0 ? 'from-yellow-400 to-orange-500' :
                                        index === 1 ? 'from-gray-300 to-gray-400' :
                                            index === 2 ? 'from-orange-300 to-orange-400' :
                                                'from-blue-400 to-indigo-500'
                                        }`}>
                                        {person.name[0].toUpperCase()}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{person.name}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{person.value.toLocaleString()} EGP</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Spending Trend Chart */}
            <div className="px-6">
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-white/10 rounded-full">
                                <TrendingUp size={18} className="text-accent-blue dark:text-white" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">Spending Trend</h3>
                        </div>
                    </div>

                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" className="dark:opacity-20" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#8E8E93' }}
                                    interval="preserveStartEnd"
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white dark:bg-[#2C2C2E] p-3 rounded-2xl shadow-xl border border-gray-100 dark:border-[#3A3A3C]">
                                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">{label}</p>
                                                    <p className="text-lg font-bold text-primary dark:text-white">
                                                        {Number(payload[0].value).toLocaleString()} <span className="text-xs font-medium text-gray-400">EGP</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                    cursor={{ stroke: '#007AFF', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#007AFF"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'white', fill: '#007AFF' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 2. Category Breakdown */}
            <div className="px-6">
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-full">
                            <PieIcon size={18} className="text-orange-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Top Categories</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Donut Chart */}
                        <div className="w-48 h-48 relative outline-none" tabIndex={-1}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart style={{ outline: 'none' }}>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        onMouseEnter={(_, index) => setActiveIndex(index)}
                                        onMouseLeave={() => setActiveIndex(null)}
                                        style={{ outline: 'none' }}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                style={{ outline: 'none' }}
                                                className="transition-all duration-300 ease-out"
                                                stroke="none"
                                                fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {activeIndex !== null ? categoryData[activeIndex].name : 'Total'}
                                </span>
                                <span className="text-lg font-bold text-primary dark:text-white">
                                    {activeIndex !== null
                                        ? categoryData[activeIndex].value.toLocaleString()
                                        : categoryData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                                </span>
                                {activeIndex === null && <span className="text-[10px] text-gray-400">EGP</span>}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 w-full space-y-3">
                            {categoryData.slice(0, 4).map((cat, index) => (
                                <div key={cat.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{cat.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Day of Week Analysis */}
            <div className="px-6">
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-full">
                            <Calendar size={18} className="text-purple-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Weekly Pattern</h3>
                    </div>

                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dayData}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(242, 242, 247, 0.5)' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none' }}
                                />
                                <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                                    {dayData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.amount === Math.max(...dayData.map(d => d.amount)) ? '#AF52DE' : '#E5E5EA'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
