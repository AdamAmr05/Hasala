import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  currentDate: Date;
  income: number;
  expense: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ currentDate, income, expense }) => {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Calculate Daily Average
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const daysPassed = isCurrentMonth ? Math.max(1, today.getDate()) : daysInMonth;

  const dailyAvg = Math.round(expense / daysPassed);

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

