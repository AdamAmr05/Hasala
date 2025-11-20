import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Transaction } from '../types';
import { transactionsApi } from '../services/api';
import CoinStack from './Dashboard/CoinStack';
import StatsOverview from './Dashboard/StatsOverview';
import ActivityFeed from './Dashboard/ActivityFeed';

import { ChevronLeft, ChevronRight } from 'lucide-react';
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
}

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  budget,
  user,
  currentDate,
  onPrevMonth,
  onNextMonth,
  onLoadMore,
  hasMore
}) => {
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const { data: stats } = useQuery({
    queryKey: ['monthlyStats', currentDate.getMonth(), currentDate.getFullYear()],
    queryFn: () => transactionsApi.getAnalytics(30, currentDate.getMonth(), currentDate.getFullYear()),
    placeholderData: (previousData) => previousData,
  });

  const income = stats?.totals.find(t => t._id === 'INCOME')?.total || 0;
  const expense = stats?.totals.find(t => t._id === 'EXPENSE')?.total || 0;

  return (
    <div className="pb-32 pt-8 space-y-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <div className="flex justify-between items-center px-6">
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Welcome back,</p>
          <h1 className="text-2xl font-bold text-primary tracking-tight">{user?.name?.split(' ')[0] || 'Friend'}</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
          <div className="w-full h-full bg-gradient-to-br from-accent-blue to-purple-500 flex items-center justify-center text-white font-bold">
            {user?.name?.[0] || 'H'}
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="px-6 flex items-center justify-between">
        <button onClick={onPrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
        <button onClick={onNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronRight size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Main Interactive Coin Stack */}
      <CoinStack
        totalSpent={expense}
        budget={budget + income}
      />

      {/* Quick Stats */}
      <StatsOverview income={income} expense={expense} currentDate={currentDate} />

      {/* Activity Feed */}
      <ActivityFeed
        transactions={transactions}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
      />
    </div>
  );
};

export default Dashboard;
