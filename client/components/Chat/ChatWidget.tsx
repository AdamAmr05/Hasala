
import React from 'react';
import { Transaction, TransactionType, Category } from '../../types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle2,
  ShoppingBag, Coffee, Home, Car, Zap, MoreHorizontal
} from 'lucide-react';

interface ChatWidgetProps {
  type: string;
  transactions: Transaction[];
  budget: number;
}

const COLORS = ['#007AFF', '#5E5CE6', '#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#AF52DE'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  [Category.FOOD]: <Coffee size={18} />,
  [Category.SHOPPING]: <ShoppingBag size={18} />,
  [Category.HOUSING]: <Home size={18} />,
  [Category.TRANSPORT]: <Car size={18} />,
  [Category.BILLS]: <Zap size={18} />, // Assuming 'Bills' maps to 'Utilities'
  [Category.EDUCATION]: <MoreHorizontal size={18} />, // No specific icon, using MoreHorizontal
  [Category.ENTERTAINMENT]: <MoreHorizontal size={18} />, // No specific icon, using MoreHorizontal
  [Category.INCOME]: <MoreHorizontal size={18} />, // No specific icon, using MoreHorizontal
  'Other': <MoreHorizontal size={18} />,
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ type, transactions, budget }) => {

  // 1. Spending Chart Widget (Area Chart)
  if (type === 'renderSpendingChart') {
    const data = transactions
      .slice(0, 7)
      .filter(t => t.type === TransactionType.EXPENSE)
      .map(t => ({
        name: t.description.length > 10 ? t.description.substring(0, 8) + '..' : t.description,
        amount: t.amount,
        fullDesc: t.description
      })).reverse();

    if (data.length === 0) return (
      <div className="p-3 bg-gray-50 rounded-xl text-center text-gray-400 text-xs my-2">No recent spending to chart</div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full overflow-hidden bg-white rounded-[24px] p-5 my-3 shadow-sm border border-gray-100"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Spending Trend</h3>
            <p className="text-lg font-bold text-primary mt-0.5">Last 7 Transactions</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <TrendingUp size={16} className="text-accent-blue" />
          </div>
        </div>
        <div className="h-40 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#8E8E93' }}
                dy={10}
              />
              <Tooltip
                cursor={{ stroke: '#007AFF', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-primary text-white text-xs rounded-lg py-2 px-3 shadow-xl">
                        <span className="font-bold block mb-1">{payload[0].payload.fullDesc}</span>
                        <span className="text-blue-200">{payload[0].value} EGP</span>
                      </div>
                    );
                  }
                  return null;
                }}
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
      </motion.div>
    );
  }

  // 2. Recent Transactions Widget (Timeline)
  if (type === 'renderRecentTransactions') {
    const recent = transactions.slice(0, 4);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] overflow-hidden my-3 shadow-sm border border-gray-100"
      >
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Activity</span>
          <Calendar size={14} className="text-gray-400" />
        </div>
        <div className="divide-y divide-gray-100">
          {recent.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-2xl transition-all flex items-center justify-center text-lg shrink-0 ${t.type === TransactionType.EXPENSE ? 'bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm' : 'bg-green-50 text-accent-green'}`}>
                  {CATEGORY_ICONS[t.category] || <MoreHorizontal size={18} />}
                </div>
                <div className="min-w-0 flex flex-col">
                  <p className="text-sm font-bold text-primary truncate">{t.description}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-sm font-bold whitespace-nowrap ${t.type === TransactionType.EXPENSE ? 'text-primary' : 'text-accent-green'}`}>
                {t.type === TransactionType.EXPENSE ? '-' : '+'}{t.amount}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // 3. Budget Overview Widget (3D Card)
  if (type === 'renderBudgetOverview') {
    const spent = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const income = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const effectiveBudget = budget + income;
    const progress = Math.min((spent / effectiveBudget) * 100, 100);
    const remaining = effectiveBudget - spent;

    // Gradient Logic
    let gradientClass = 'from-blue-600 to-indigo-600'; // Default (Safe-ish)

    if (remaining < 0) {
      // Overspent
      gradientClass = 'from-orange-400 to-pink-500';
    } else if (remaining < effectiveBudget * 0.2) {
      // Danger Zone (Low Remaining)
      gradientClass = 'from-blue-400 to-blue-100';
    } else {
      // Safe (High Remaining)
      gradientClass = 'from-green-400 to-emerald-500';
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[24px] p-6 my-3 text-white shadow-lg shadow-blue-500/20 group isolate"
      >
        {/* Glass/Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} z-0`}></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">Remaining Budget</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight">{remaining.toLocaleString()}</span>
                <span className="text-sm font-medium text-white/80">EGP</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              {remaining < effectiveBudget * 0.2 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-medium text-white/80">
              <span>{progress.toFixed(0)}% Used</span>
              <span>{effectiveBudget.toLocaleString()} EGP Limit</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 4. Category Breakdown Widget (Donut Chart)
  if (type === 'renderCategoryBreakdown') {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const byCategory = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] p-5 my-3 shadow-sm border border-gray-100"
      >
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Top Categories</h3>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600 font-medium truncate max-w-[80px]">{entry.name}</span>
                </div>
                <span className="font-bold text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // 5. Monthly Projection Widget (Forecast Graph)
  if (type === 'renderMonthlyProjection') {
    // Simple linear projection logic
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const totalSpent = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyAvg = totalSpent / Math.max(1, dayOfMonth);
    const projectedTotal = dailyAvg * daysInMonth;
    const isOverBudget = projectedTotal > budget;

    const data = [
      { day: 'Day 1', amount: 0 },
      { day: `Day ${dayOfMonth}`, amount: totalSpent },
      { day: 'End', amount: projectedTotal, projected: true }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[24px] p-5 my-3 shadow-sm border border-gray-100"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">End of Month Forecast</h3>
            <p className={`text-lg font-bold mt-1 ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
              {isOverBudget ? '⚠️ Risk of Overspending' : '✅ On Track to Save'}
            </p>
          </div>
        </div>

        <div className="h-32 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8E8E93' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${Math.round(value)} EGP`, 'Total']}
              />
              <ReferenceLine y={budget} stroke="#E5E5EA" strokeDasharray="3 3" label={{ value: 'Limit', position: 'insideTopRight', fontSize: 10, fill: '#8E8E93' }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={isOverBudget ? '#FF3B30' : '#34C759'}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 leading-relaxed">
            At your current rate of <span className="font-bold text-primary">{Math.round(dailyAvg)} EGP/day</span>,
            you will spend <span className="font-bold text-primary">{Math.round(projectedTotal)} EGP</span> by month end.
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default ChatWidget;
