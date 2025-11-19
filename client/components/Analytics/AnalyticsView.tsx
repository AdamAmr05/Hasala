import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { Transaction, TransactionType, Category } from '../../types';
import { TrendingUp, Calendar, PieChart as PieIcon, ArrowUpRight } from 'lucide-react';

interface AnalyticsViewProps {
    transactions: Transaction[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions }) => {
    // 1. Filter Expenses Only
    const expenses = useMemo(() =>
        transactions.filter(t => t.type === TransactionType.EXPENSE),
        [transactions]);

    // 2. Prepare Trend Data (Last 30 Days)
    const trendData = useMemo(() => {
        const data = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const dailyTotal = expenses
                .filter(t => t.date.startsWith(dateStr))
                .reduce((sum, t) => sum + t.amount, 0);

            data.push({
                date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                amount: dailyTotal
            });
        }
        return data;
    }, [expenses]);

    // 3. Prepare Category Data
    const categoryData = useMemo(() => {
        const totals: Record<string, number> = {};
        expenses.forEach(t => {
            totals[t.category] = (totals[t.category] || 0) + t.amount;
        });

        return Object.entries(totals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [expenses]);

    // 4. Prepare Day of Week Data
    const dayData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const totals = new Array(7).fill(0);

        expenses.forEach(t => {
            const dayIndex = new Date(t.date).getDay();
            totals[dayIndex] += t.amount;
        });

        return days.map((day, index) => ({
            day,
            amount: totals[index]
        }));
    }, [expenses]);

    const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#AF52DE'];

    return (
        <div className="pb-32 pt-8 space-y-8 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="px-6">
                <h1 className="text-2xl font-bold text-primary tracking-tight">Analytics</h1>
                <p className="text-sm text-gray-500">Deep dive into your spending habits.</p>
            </div>

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
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Last 30 Days</span>
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
                                    interval={6}
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
                    <p className="text-xs text-center text-gray-400 mt-4">
                        Your highest spending day is usually <span className="font-bold text-purple-600">{dayData.reduce((a, b) => a.amount > b.amount ? a : b).day}</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
