import React from 'react';
import { Transaction } from '../types';
import SpendingRing from './Dashboard/SpendingRing';
import StatsOverview from './Dashboard/StatsOverview';
import ActivityFeed from './Dashboard/ActivityFeed';

interface DashboardProps {
  transactions: Transaction[];
  budget: number;
  user: { name: string; avatar?: string } | null;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, user }) => {
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

      {/* Main Interactive Ring */}
      <SpendingRing transactions={transactions} budget={budget} />

      {/* Quick Stats */}
      <StatsOverview transactions={transactions} />

      {/* Activity Feed */}
      <ActivityFeed transactions={transactions} />
    </div>
  );
};

export default Dashboard;
