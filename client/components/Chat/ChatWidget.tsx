import React from 'react';
import { Transaction, TransactionType, Category } from '../../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChatWidgetProps {
  type: string;
  transactions: Transaction[];
  budget: number;
}

const getCategoryIcon = (category: Category) => {
  switch (category) {
    case Category.FOOD: return "🍔";
    case Category.TRANSPORT: return "🚕";
    case Category.ENTERTAINMENT: return "🎬";
    case Category.SHOPPING: return "🛍️";
    case Category.BILLS: return "🧾";
    case Category.EDUCATION: return "📚";
    case Category.INCOME: return "💰";
    default: return "✨";
  }
};

const ChatWidget: React.FC<ChatWidgetProps> = ({ type, transactions, budget }) => {
  
  // 1. Spending Chart Widget
  if (type === 'renderSpendingChart') {
    const data = transactions
      .slice(0, 7)
      .filter(t => t.type === TransactionType.EXPENSE)
      .map(t => ({
        name: t.description.length > 10 ? t.description.substring(0, 8) + '..' : t.description,
        amount: t.amount,
        fullDesc: t.description
      }));

    if (data.length === 0) return (
        <div className="p-3 bg-gray-50 rounded-xl text-center text-gray-400 text-xs my-2">No recent data to chart</div>
    );

    return (
      <div className="w-full overflow-hidden bg-gray-50 rounded-[18px] p-4 my-3 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Spending Trends</h3>
        </div>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 9, fill: '#8E8E93'}} 
                dy={5}
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-gray-900/90 backdrop-blur text-white text-[10px] rounded py-1 px-2 shadow-lg">
                        <span className="font-medium">{payload[0].payload.fullDesc}:</span> {payload[0].value}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 4, 4]} barSize={18}>
                 {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#007AFF' : '#5E5CE6'} />
                 ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // 2. Recent Transactions Widget
  if (type === 'renderRecentTransactions') {
    const recent = transactions.slice(0, 3);
    return (
      <div className="bg-gray-50 rounded-[18px] overflow-hidden my-3 border border-gray-100">
        <div className="px-4 py-2 border-b border-gray-200/50">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recent Activity</span>
        </div>
        <div className="divide-y divide-gray-200/50">
          {recent.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-sm shrink-0">
                  {getCategoryIcon(t.category)}
                </div>
                <div className="min-w-0 flex flex-col">
                  <p className="text-xs font-semibold text-gray-900 truncate">{t.description}</p>
                </div>
              </div>
              <span className={`text-xs font-bold whitespace-nowrap ${t.type === TransactionType.EXPENSE ? 'text-gray-900' : 'text-[#34C759]'}`}>
                {t.type === TransactionType.EXPENSE ? '-' : '+'}{t.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Budget Overview Widget
  if (type === 'renderBudgetOverview') {
    const spent = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);
    const progress = Math.min((spent / budget) * 100, 100);
    const remaining = budget - spent;
    
    return (
       <div className="relative overflow-hidden rounded-[18px] p-4 my-3 text-white shadow-md shadow-blue-500/10 group isolate">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF] to-[#0062CC] z-0"></div>
          
          <div className="relative z-10 flex justify-between items-center">
             <div>
               <p className="text-[10px] font-medium text-blue-100 uppercase tracking-wider mb-0.5">Remaining</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-bold tracking-tight">{remaining.toLocaleString()}</span>
                 <span className="text-xs font-medium text-blue-100">EGP</span>
               </div>
             </div>
             
             <div className="relative w-10 h-10 flex items-center justify-center">
               <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                  <path className="text-blue-900/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="text-white" strokeDasharray={`${progress}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
             </div>
          </div>
       </div>
    );
  }

  return null;
};

export default ChatWidget;