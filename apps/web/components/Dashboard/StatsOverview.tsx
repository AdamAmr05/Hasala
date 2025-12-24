import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, BarChart3, ChevronRight } from 'lucide-react';

interface StatsOverviewProps {
  currentDate: Date;
  income: number;
  expense: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ currentDate, income, expense }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4 px-6">
      {/* Money In */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex flex-col justify-between h-32">
        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-2">
          <ArrowDown className="text-accent-green" size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Income</p>
          <p className="text-xl font-bold text-primary dark:text-white">{income.toLocaleString()}</p>
        </div>
      </div>

      {/* Money Out */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex flex-col justify-between h-32">
        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
          <ArrowUp className="text-[#FF3B30]" size={20} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Spent</p>
          <p className="text-xl font-bold text-primary dark:text-white">{expense.toLocaleString()}</p>
        </div>
      </div>

      {/* Analytics Navigation Banner */}
      <div
        onClick={() => navigate('/analytics')}
        className="col-span-2 bg-white dark:bg-[#1C1C1E] rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <BarChart3 className="text-purple-500" size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Analytics</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium group-hover:text-purple-500 transition-colors">Deep dive into your spending</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-purple-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;

