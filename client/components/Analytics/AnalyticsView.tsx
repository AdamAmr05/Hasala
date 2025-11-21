import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { transactionsApi } from '../../services/api';
import { TrendingUp, Calendar, PieChart as PieIcon, Users, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnalyticsView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['analytics', month, year],
        queryFn: () => transactionsApi.getAnalytics(30, month, year),
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
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
                <AlertCircle size={32} className="text-red-500" />
                <p>Could not load analytics.</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
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
        name: p._id,
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

    return (
        <div className="pb-32 pt-8 space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Header & Month Navigation */}
            <div className="px-6 space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-primary tracking-tight">Analytics</h1>
                    <p className="text-sm text-gray-500">Deep dive into your spending habits.</p>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <button onClick={onPrevMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <ChevronLeft size={20} className="text-gray-500" />
                    </button>
                    <motion.h2
                        key={monthName}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-bold text-primary"
                    >
                        {monthName}
                    </motion.h2>
                    <button onClick={onNextMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                        <ChevronRight size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Income Overview Section */}
            {data.incomeBreakdown && data.incomeBreakdown.length > 0 && (
                <div className="px-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-green-50 rounded-full">
                                <TrendingUp size={18} className="text-green-500" />
                            </div>
                            <h3 className="font-bold text-gray-900">Income Sources</h3>
                        </div>

                        {/* Total Income Display */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Income</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {data.totals.find(t => t._id === 'INCOME')?.total.toLocaleString() || 0} <span className="text-sm text-gray-500">EGP</span>
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
                                            <span className="font-medium text-gray-700">{source._id}</span>
                                            <span className="font-bold text-gray-900">{source.total.toLocaleString()} EGP</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
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
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-50 rounded-full">
                                <Users size={18} className="text-indigo-500" />
                            </div>
                            <h3 className="font-bold text-gray-900">People</h3>
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
                                        <p className="text-xs font-bold text-gray-900 truncate max-w-[80px]">{person.name}</p>
                                        <p className="text-[10px] text-gray-500 font-medium">{person.value.toLocaleString()} EGP</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Spending Trend Chart */}
            <div className="px-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-full">
                                <TrendingUp size={18} className="text-accent-blue" />
                            </div>
                            <h3 className="font-bold text-gray-900">Spending Trend</h3>
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
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#8E8E93' }}
                                    interval="preserveStartEnd"
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#007AFF', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#007AFF"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 2. Category Breakdown */}
            <div className="px-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-orange-50 rounded-full">
                            <PieIcon size={18} className="text-orange-500" />
                        </div>
                        <h3 className="font-bold text-gray-900">Top Categories</h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Donut Chart */}
                        <div className="w-48 h-48 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xs font-bold text-gray-400">BY CAT</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 w-full space-y-3">
                            {categoryData.slice(0, 4).map((cat, index) => (
                                <div key={cat.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{cat.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Day of Week Analysis */}
            <div className="px-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-50 rounded-full">
                            <Calendar size={18} className="text-purple-500" />
                        </div>
                        <h3 className="font-bold text-gray-900">Weekly Pattern</h3>
                    </div>

                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dayData}>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                                <Tooltip
                                    cursor={{ fill: '#F2F2F7' }}
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
