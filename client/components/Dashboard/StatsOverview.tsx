import React from 'react';
import { Transaction, TransactionType } from '../../types';
import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  transactions: Transaction[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ transactions }) => {
  const income = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Calculate Daily Average (Current Month)
  const today = new Date();
  const currentMonthExpenses = transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === TransactionType.EXPENSE &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
  }).reduce((acc, curr) => acc + curr.amount, 0);

  const daysPassed = Math.max(1, today.getDate());
  const dailyAvg = Math.round(currentMonthExpenses / daysPassed);

  return (
    <div className="grid grid-cols-2 gap-4 px-6">
      {/* Money In */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
          <ArrowDown className="text-accent-green" size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Income</p>
          <p className="text-xl font-bold text-primary">{income.toLocaleString()}</p>
        </div>
      </div>

      {/* Money Out */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between h-32">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-2">
          <ArrowUp className="text-[#FF3B30]" size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Spent</p>
          <p className="text-xl font-bold text-primary">{expense.toLocaleString()}</p>
        </div>
      </div>

      {/* Daily Average Banner */}
      <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <TrendingUp className="text-accent-blue" size={16} />
          </div>
          <span className="text-sm font-medium text-gray-600">Daily Average</span>
        </div>
        <span className="font-bold text-primary">{dailyAvg.toLocaleString()} <span className="text-xs font-normal text-gray-400">EGP</span></span>
      </div>
    </div>
  );
};

export default StatsOverview;

