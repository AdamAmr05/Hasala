import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '../types';
import { transactionsApi } from '../services/api';
import CoinStack from './Dashboard/CoinStack';
import StatsOverview from './Dashboard/StatsOverview';
import ActivityFeed from './Dashboard/ActivityFeed';

import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardProps {
  transactions: Transaction[];
  budget: number;
  user: { name: string; avatar?: string } | null;
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  onSettingsClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  budget,
  user,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onLoadMore,
  hasMore,
  onSettingsClick
}) => {
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['monthlyStats', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: () => transactionsApi.getAnalytics(30, currentDate.getMonth(), currentDate.getFullYear()),
    placeholderData: (previousData) => previousData,
  });

  const income = stats?.totals.find(t => t._id === 'INCOME')?.total || 0;
  const expense = stats?.totals.find(t => t._id === 'EXPENSE')?.total || 0;

  return (
    <div className="pb-32 pt-8 space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] flex items-center justify-center text-primary dark:text-white font-bold text-lg">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Welcome back,</p>
            <h1 className="text-xl font-bold text-primary dark:text-white">{user?.name?.split(' ')[0] || 'User'}</h1>
          </div>
        </div>
        <button
          onClick={onSettingsClick}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#3A3A3C] shadow-sm flex items-center justify-center text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-all"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Month Navigation */}
      <div className="px-6 flex items-center justify-between">
        <button onClick={onPrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors">
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
        <button onClick={onNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors">
          <ChevronRight size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Main Interactive Coin Stack */}
      <CoinStack
        totalSpent={expense}
        budget={income}
        isLoading={isLoading}
      />

      {/* Quick Stats */}
      <StatsOverview income={income} expense={expense} currentDate={currentDate} />

      {/* Activity Feed */}
      <ActivityFeed
        transactions={transactions}
        categories={stats?.categoryBreakdown}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
      />
    </div>
  );
};

export default Dashboard;
