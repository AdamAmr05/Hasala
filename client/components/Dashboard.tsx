import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  budget: number;
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, budget }) => {
  const totalSpent = useMemo(() => 
    transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0),
  [transactions]);

  const remaining = budget - totalSpent;
  const progress = Math.min((totalSpent / budget) * 100, 100);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [transactions]);

  const COLORS = ['#007AFF', '#5E5CE6', '#FF3B30', '#34C759', '#FFCC00', '#FF9500'];

  return (
    <div className="pb-24 pt-8 px-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-subtext text-sm font-medium uppercase tracking-wider">Balance</h2>
          <h1 className="text-4xl font-bold text-text tracking-tight">{remaining.toLocaleString()} <span className="text-xl text-subtext font-normal">EGP</span></h1>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
           <img src="https://picsum.photos/100/100" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Monthly Budget Card */}
      <div className="bg-white rounded-3xl p-6 shadow-apple relative overflow-hidden">
        <div className="flex justify-between mb-2">
          <span className="font-semibold text-gray-700">Monthly Budget</span>
          <span className="text-subtext">{Math.round(progress)}% used</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${progress > 90 ? 'bg-danger' : 'bg-primary'}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex justify-between text-sm text-subtext">
          <span>Spent: {totalSpent.toLocaleString()}</span>
          <span>Limit: {budget.toLocaleString()}</span>
        </div>
      </div>

      {/* Analytics Preview */}
      <div className="bg-white rounded-3xl p-6 shadow-apple">
        <h3 className="font-semibold text-gray-800 mb-4">Spending by Category</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                 itemStyle={{ color: '#333' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {transactions.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === TransactionType.EXPENSE ? 'bg-red-50 text-danger' : 'bg-green-50 text-success'}`}>
                  {t.type === TransactionType.EXPENSE ? 
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg> 
                    : 
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{t.description}</p>
                  <p className="text-xs text-subtext">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-bold ${t.type === TransactionType.EXPENSE ? 'text-gray-900' : 'text-success'}`}>
                {t.type === TransactionType.EXPENSE ? '-' : '+'}{t.amount}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center text-subtext py-8">
              No transactions yet. Tap + to add one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;