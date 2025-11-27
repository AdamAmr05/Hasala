
import React from 'react';
import { Transaction, TransactionType, Category } from '../../types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, ReferenceLine, YAxis, AreaChart, Area, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Calendar, AlertCircle, CheckCircle2,
  ShoppingBag, Coffee, Home, Car, Zap, MoreHorizontal, HandHeart, AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Repeat
} from 'lucide-react';

import IncomeOverview from './Tools/IncomeOverview';

interface ChatWidgetProps {
  type: string;
  transactions: Transaction[];
  budget: number;
  data?: Record<string, any>;
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
  [Category.GIVING]: <HandHeart size={18} />,
  'Other': <MoreHorizontal size={18} />,
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ type, transactions, budget, data: propsData }) => {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // 1. Spending Chart Widget (Area Chart)
  if (type === 'renderSpendingChart') {
    let data = [];

    // Check for server-side snapshot data (preferred)
    if (propsData && propsData.trend && Array.isArray(propsData.trend)) {
      data = propsData.trend;
    } else {
      // Fallback: Calculate Daily Trend (Last 7 Days) client-side
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i));
        return d;
      });

      data = last7Days.map(date => {
        const dateStr = date.toLocaleDateString();
        const dayTotal = transactions
          .filter(t =>
            t.type === TransactionType.EXPENSE &&
            new Date(t.date).toLocaleDateString() === dateStr
          )
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          name: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          amount: dayTotal,
          fullDesc: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        };
      });
    }

    if (data.length === 0) return (
      <div className="p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl text-center text-gray-400 dark:text-gray-500 text-xs my-2">No recent spending to chart</div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full overflow-hidden bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 my-3 shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Spending Trend</h3>
            <p className="text-lg font-bold text-primary dark:text-white mt-0.5">Last 7 Days</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-white/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-accent-blue dark:text-white" />
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-[#2C2C2E] p-2 rounded-xl shadow-xl border border-gray-100 dark:border-[#3A3A3C]">
                        <p className="text-[9px] font-medium text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">{payload[0].payload.fullDesc}</p>
                        <p className="text-sm font-bold text-primary dark:text-white">
                          {Number(payload[0].value).toLocaleString()} <span className="text-[9px] font-medium text-gray-400">EGP</span>
                        </p>
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
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'white', fill: '#007AFF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  }

  // 2. Recent Transactions Widget (Timeline)
  if (type === 'renderRecentTransactions') {
    // Use injected snapshot if available, otherwise fallback to live prop (legacy)
    const recent = propsData?.recentTransactions || transactions.slice(0, 4);
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden my-3 shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2C2C2E] bg-gray-50/50 dark:bg-[#0D0D0F]/50 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Activity</span>
          <Calendar size={14} className="text-gray-400 dark:text-gray-500" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#2C2C2E]">
          {recent.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${t.type === TransactionType.EXPENSE ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-300' : 'bg-green-50 dark:bg-green-500/10 text-accent-green'}`}>
                  {CATEGORY_ICONS[t.category] || <MoreHorizontal size={18} />}
                </div>
                <div className="min-w-0 flex flex-col">
                  <p className="text-sm font-bold text-primary dark:text-white truncate">{t.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-300 font-medium">{new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-sm font-bold whitespace-nowrap ${t.type === TransactionType.EXPENSE ? 'text-primary dark:text-white' : 'text-accent-green'}`}>
                {t.type === TransactionType.EXPENSE ? '-' : '+'}{t.amount}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // 3. Recurring Expenses Widget (List)
  if (type === 'renderRecurringExpenses') {
    const recurring = propsData?.recurringExpenses || [];
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[24px] overflow-hidden my-3 shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#2C2C2E] bg-indigo-50/50 dark:bg-indigo-500/10 flex justify-between items-center">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Recurring Expenses</span>
          <Repeat size={14} className="text-indigo-500" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#2C2C2E]">
          {recurring.length > 0 ? (
            recurring.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400`}>
                    {CATEGORY_ICONS[t.category] || <MoreHorizontal size={18} />}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <p className="text-sm font-bold text-primary dark:text-white truncate">{t.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-300 font-medium">Due Day {t.dayOfMonth}</p>
                  </div>
                </div>
                <span className="text-sm font-bold whitespace-nowrap text-primary dark:text-white">
                  {t.amount.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">EGP</span>
                </span>
              </div>
            ))
          ) : (
            <div className="p-5 text-center text-sm text-gray-400 dark:text-gray-500">
              No active recurring expenses found.
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // 4. Budget Overview Widget (3D Card)
  if (type === 'renderBudgetOverview') {
    // Use injected data if available, otherwise fallback to local calculation (legacy)
    const spent = propsData?.totalSpent ?? transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const income = propsData?.totalIncome ?? transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const budgetGoal = propsData?.budget ?? budget;

    const effectiveBudget = budgetGoal > 0 ? budgetGoal : income;
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
    // Use injected data if available
    let data: { name: string; value: number }[] = [];

    if (propsData?.categories) {
      data = (propsData.categories as any[]).map(c => ({ name: c.name, value: Number(c.value) }));
    } else {
      // Fallback to local calculation
      const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
      const byCategory = expenses.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      data = Object.entries(byCategory)
        .map(([name, value]): { name: string; value: number } => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value);
    }

    data = data.slice(0, 5);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 my-3 shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
      >
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Top Categories</h3>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 relative outline-none" tabIndex={-1}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart style={{ outline: 'none' }}>
                <Pie
                  data={data}
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  style={{ outline: 'none' }}
                >
                  {data.map((entry, index) => (
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
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {activeIndex !== null ? data[activeIndex].name : 'Total'}
              </span>
              <span className="text-sm font-bold text-primary dark:text-white">
                {activeIndex !== null
                  ? data[activeIndex].value.toLocaleString()
                  : data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-1.5">
            {data.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[70px]">{entry.name}</span>
                </div>
                <span className="font-bold text-primary dark:text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // 5. Monthly Projection Widget (Forecast Graph)
  if (type === 'renderMonthlyProjection') {
    // 1. Try Server Data (Snapshot)
    let spent = propsData?.spent;
    let budgetGoal = propsData?.budget;
    let projected = propsData?.projected;
    let dailyAvg = propsData?.dailyAverage;
    let dayOfMonth = propsData?.dayOfMonth;
    let daysInMonth = propsData?.daysInMonth;

    // 2. Fallback to Client Calculation (for old messages or missing data)
    if (spent === undefined || spent === 0) {
      const today = new Date();
      dayOfMonth = today.getDate();
      daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

      spent = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      budgetGoal = budget; // Use global budget prop
      dailyAvg = spent / Math.max(1, dayOfMonth);
      projected = dailyAvg * daysInMonth;
    }

    // Safe defaults
    spent = spent ?? 0;
    budgetGoal = budgetGoal ?? 0;
    projected = projected ?? 0;
    dailyAvg = dailyAvg ?? 0;

    const isOverBudget = projected > budgetGoal;
    const statusColor = isOverBudget ? 'text-red-500' : 'text-green-500';
    const statusBg = isOverBudget ? 'bg-red-50 dark:bg-red-500/10' : 'bg-green-50 dark:bg-green-500/10';
    const statusIcon = isOverBudget ? <AlertTriangle size={16} className="text-red-500" /> : <TrendingUp size={16} className="text-green-500" />;

    // Generate Curve Data (Start -> Today -> End)
    // We use a few more points to make the curve look nice if we want, but 3 is enough for monotone
    const chartData = [
      { day: 'Start', amount: 0 },
      { day: 'Today', amount: spent },
      { day: 'End', amount: projected }
    ];

    // Custom Dot to mask the dashed line
    const CustomDot = (props: any) => {
      const { cx, cy, stroke } = props;
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4.5}
          stroke={stroke}
          strokeWidth={2}
          className="fill-white dark:fill-[#1C1C1E]" // Matches card bg to mask the line
        />
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 my-3 shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">End of Month Forecast</h3>
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full w-fit ${statusBg}`}>
              {statusIcon}
              <span className={`text-sm font-bold ${statusColor}`}>
                {isOverBudget ? 'Risk of Overspending' : 'On Track'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Budget</p>
            <p className="text-sm font-bold text-primary dark:text-white">{budgetGoal.toLocaleString()} EGP</p>
          </div>
        </div>

        <div className="h-40 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" className="dark:opacity-10" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#8E8E93' }}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis hide domain={[0, Math.max(projected, budgetGoal) * 1.1]} />
              <Tooltip
                cursor={{ stroke: isOverBudget ? '#FF3B30' : '#34C759', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white dark:bg-[#2C2C2E] p-2 rounded-xl shadow-lg border border-gray-100 dark:border-[#3A3A3C]">
                        <p className="text-xs font-bold text-primary dark:text-white">
                          {Math.round(Number(payload[0].value)).toLocaleString()} EGP
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Budget Limit Line */}
              <ReferenceLine
                y={budgetGoal}
                stroke="#8E8E93"
                strokeDasharray="3 3"
                label={{
                  position: 'insideTopRight',
                  value: 'Limit',
                  fill: '#8E8E93',
                  fontSize: 10,
                  fontWeight: 500
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={isOverBudget ? '#FF3B30' : '#34C759'}
                strokeWidth={3}
                dot={<CustomDot />}
                activeDot={{ r: 6, strokeWidth: 0, fill: isOverBudget ? '#FF3B30' : '#34C759' }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            At your current rate of <span className="font-bold text-primary dark:text-white">{Math.round(dailyAvg).toLocaleString()} EGP/day</span>,
            you will spend <span className={`font-bold ${statusColor}`}>{Math.round(projected).toLocaleString()} EGP</span> by month end.
          </p>
        </div>
      </motion.div>
    );
  }

  // 6. People Breakdown Widget (Bubbles)
  if (type === 'renderPeopleBreakdown') {
    let data: { name: string; value: number }[] = [];

    if (propsData?.people) {
      data = (propsData.people as any[]).map(p => ({ name: p.name, value: Number(p.value) }));
    } else {
      const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE && t.relatedPerson);
      const byPerson = expenses.reduce((acc, t) => {
        const person = t.relatedPerson!;
        acc[person] = (acc[person] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

      data = Object.entries(byPerson)
        .map(([name, value]): { name: string; value: number } => ({ name, value: Number(value) }))
        .sort((a, b) => b.value - a.value);
    }

    data = data.slice(0, 5);

    if (data.length === 0) return (
      <div className="p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl text-center text-gray-400 dark:text-gray-500 text-xs my-2">No people tracked yet.</div>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1C1C1E] rounded-[24px] p-5 my-3 shadow-sm border border-gray-100 dark:border-[#2C2C2E]"
      >
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">People You Support</h3>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {data.map((person, index) => (
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
      </motion.div>
    );
  }

  // 7. Income Overview Widget
  if (type === 'renderIncomeOverview') {
    const incomeSources = propsData?.incomeSources || [];
    const totalIncome = propsData?.totalIncome || 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-3"
      >
        <IncomeOverview incomeSources={incomeSources} totalIncome={totalIncome} />
      </motion.div>
    );
  }

  return null;
};

export default ChatWidget;
