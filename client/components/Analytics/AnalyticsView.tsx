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
import SavingsOverview from '../Chat/Tools/SavingsOverview';
import InfographicGenerator from './InfographicGenerator';
import { savingsApi } from '../../services/api';

const AnalyticsView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['analytics', month, year],
        queryFn: () => transactionsApi.getAnalytics(30, month, year, Intl.DateTimeFormat().resolvedOptions().timeZone),
        placeholderData: (previousData) => previousData,
    });

    const { data: savingsGoals } = useQuery({
        queryKey: ['savingsGoals'],
        queryFn: savingsApi.list,
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
        // Robust Date Parsing (YYYY-MM-DD) to avoid timezone shifts
        const [y, m, day] = d._id.split('-').map(Number);
        const date = new Date(y, m - 1, day); // Local Midnight
        const dayIndex = date.getDay();
        dayTotals[dayIndex] += d.total;
    });
    const dayData = days.map((day, index) => ({ day, amount: dayTotals[index] }));

    // Find max spending day for insight
    const maxDay = dayData.reduce((max, current) => current.amount > max.amount ? current : max, dayData[0]);



    // Transform Savings Data
    let savingsData = undefined;
    if (savingsGoals) {
        const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
        const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

        const topGoals = savingsGoals
            .map(g => ({
                name: g.name,
                current: g.currentAmount,
                target: g.targetAmount,
                progress: Math.min((g.currentAmount / g.targetAmount) * 100, 100),
                color: g.color,
                icon: g.icon
            }))
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 3);

        savingsData = {
            totalSaved,
            totalTarget,
            overallProgress: totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0,
            topGoals
        };
    }
    // Curated Palette (Indigo, Blue, Emerald, Amber, Rose, Violet, Cyan, Orange)
    const CATEGORY_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#f97316', '#34C759', '#AF52DE'];

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
            </div >

            {/* AI Infographic Generator */}
            <div className="px-6">
                <InfographicGenerator />
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

            {/* Savings Overview Section */}
            {savingsData && (
                <div className="px-6">
                    <SavingsOverview data={savingsData} />
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

            {/* Daily Average Banner */}
            <div className="px-6">
                <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-white/10 flex items-center justify-center">
                            <TrendingUp className="text-accent-blue dark:text-white" size={16} />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Daily Average</span>
                    </div>
                    <span className="font-bold text-primary dark:text-white">
                        {Math.round(totalExpense / (
                            currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
                                ? Math.max(1, new Date().getDate())
                                : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
                        )).toLocaleString()} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">EGP</span>
                    </span>
                </div>
            </div>

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
                        <div className="relative h-[192px] w-[192px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        cornerRadius={6}
                                        minAngle={15}
                                        dataKey="value"
                                        stroke="none"
                                        onMouseEnter={(_, index) => setActiveIndex(index)}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                                                className="transition-all duration-300 outline-none"
                                                style={{
                                                    filter: activeIndex !== null && activeIndex !== index ? 'opacity(0.3)' : 'opacity(1)',
                                                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                                                    transformOrigin: 'center',
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-200">
                                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    {activeIndex !== null ? categoryData[activeIndex].name : 'Total'}
                                </span>
                                <span className="text-xl font-bold text-primary dark:text-white">
                                    {activeIndex !== null
                                        ? categoryData[activeIndex].value.toLocaleString()
                                        : categoryData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Legend (Top 6 Only, Name Only) */}
                        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3">
                            {categoryData.slice(0, 6).map((entry, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 text-xs transition-opacity duration-200"
                                    style={{ opacity: activeIndex !== null && activeIndex !== index ? 0.3 : 1 }}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                                    <span className="text-gray-600 dark:text-gray-300 font-medium truncate">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Day of Week Analysis */}
            <div className="px-6">
                <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-[#2C2C2E]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-full">
                                <Calendar size={18} className="text-purple-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Weekly Pattern</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    Most spending on <span className="font-bold text-purple-500">{maxDay.amount > 0 ? maxDay.day + 's' : '...'}</span> (Last 30 Days)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dayData}
                                onMouseMove={(state) => {
                                    if (state.isTooltipActive && typeof state.activeTooltipIndex === 'number') {
                                        setActiveDayIndex(state.activeTooltipIndex);
                                    } else {
                                        setActiveDayIndex(null);
                                    }
                                }}
                                onMouseLeave={() => setActiveDayIndex(null)}
                            >
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#8E8E93' }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
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
                                />
                                <Bar dataKey="amount" radius={[8, 8, 8, 8]}>
                                    {dayData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill="#AF52DE"
                                            className="transition-all duration-300"
                                            style={{
                                                opacity: activeDayIndex === null || activeDayIndex === index ? 1 : 0.3,
                                                outline: 'none'
                                            }}
                                        />
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
