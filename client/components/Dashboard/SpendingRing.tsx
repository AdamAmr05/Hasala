import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, TransactionType } from '../../types';

interface SpendingRingProps {
  transactions: Transaction[];
  budget: number;
}

type ViewMode = 'ring' | 'bar';

const SpendingRing: React.FC<SpendingRingProps> = ({ transactions, budget }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('ring');

  const totalSpent = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const remaining = Math.max(0, budget - totalSpent);
  const progress = Math.min((totalSpent / budget) * 100, 100);
  const isOverBudget = totalSpent > budget;

  const ringData = [
    { name: 'Spent', value: totalSpent },
    { name: 'Remaining', value: remaining }
  ];

  // Prepare weekly data for bar chart (mock logic for now, grouping by day)
  const weeklyData = transactions.reduce((acc: any[], tx) => {
    const day = new Date(tx.date).toLocaleDateString('en-US', { weekday: 'short' });
    const existing = acc.find(d => d.day === day);
    if (existing) {
        existing.amount += tx.amount;
    } else {
        acc.push({ day, amount: tx.amount });
    }
    return acc;
  }, []).slice(0, 7); // Limit to 7 days

  const COLORS = [isOverBudget ? '#FF3B30' : '#007AFF', '#F2F2F7'];

  return (
    <div
        className="w-full aspect-square max-h-[320px] max-w-[320px] mx-auto relative cursor-pointer px-6"
        onClick={() => setViewMode(prev => prev === 'ring' ? 'bar' : 'ring')}
    >
      <AnimatePresence mode='wait'>
        {viewMode === 'ring' ? (
            <motion.div 
                key="ring"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full h-full flex items-center justify-center relative"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={ringData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            {ringData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-subtext text-sm font-medium uppercase tracking-wider">Remaining</span>
                    <span className="text-4xl font-bold text-primary tracking-tight mt-1">
                        {remaining.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400 mt-2 font-medium">EGP</span>
                </div>
            </motion.div>
        ) : (
            <motion.div 
                key="bar"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full h-full p-4"
            >
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8E8E93' }} />
                        <Bar dataKey="amount" fill="#007AFF" radius={[4, 4, 4, 4]} />
                    </BarChart>
                </ResponsiveContainer>
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* Pagination Dots */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-2">
        <div className={`w-2 h-2 rounded-full transition-all ${viewMode === 'ring' ? 'bg-primary w-4' : 'bg-gray-300'}`} />
        <div className={`w-2 h-2 rounded-full transition-all ${viewMode === 'bar' ? 'bg-primary w-4' : 'bg-gray-300'}`} />
      </div>
    </div>
  );
};

export default SpendingRing;

