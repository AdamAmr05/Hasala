import React, { useState } from 'react';
import { Transaction, TransactionType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Coffee, Home, Car, Zap, MoreHorizontal } from 'lucide-react';

interface ActivityFeedProps {
  transactions: Transaction[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Food': <Coffee size={18} />,
  'Shopping': <ShoppingBag size={18} />,
  'Housing': <Home size={18} />,
  'Transport': <Car size={18} />,
  'Utilities': <Zap size={18} />,
  'Other': <MoreHorizontal size={18} />,
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'categories'>('recent');

  // Group by category
  const categoryData = Object.entries(
    transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc: Record<string, number>, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {})
  ).sort(([, a], [, b]) => b - a); // Sort descending

  return (
    <div className="px-6 pb-24">
      {/* Segmented Control */}
      <div className="bg-gray-200/50 p-1 rounded-xl flex mb-6 relative">
        {/* Sliding Background */}
        <motion.div 
            className="absolute top-1 bottom-1 bg-white rounded-[10px] shadow-sm z-0"
            initial={false}
            animate={{ 
                left: activeTab === 'recent' ? '4px' : '50%', 
                width: 'calc(50% - 6px)' 
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        
        <button 
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-2 text-sm font-semibold z-10 relative transition-colors ${activeTab === 'recent' ? 'text-primary' : 'text-gray-500'}`}
        >
            Recent Activity
        </button>
        <button 
             onClick={() => setActiveTab('categories')}
             className={`flex-1 py-2 text-sm font-semibold z-10 relative transition-colors ${activeTab === 'categories' ? 'text-primary' : 'text-gray-500'}`}
        >
            Top Categories
        </button>
      </div>

      {/* List Content */}
      <div className="space-y-4">
        <AnimatePresence mode='wait'>
            {activeTab === 'recent' ? (
                <motion.div 
                    key="recent"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                >
                    {transactions.slice(0, 10).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === TransactionType.EXPENSE ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-accent-green'}`}>
                                    {CATEGORY_ICONS[tx.category] || <MoreHorizontal size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary">{tx.description}</p>
                                    <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className={`font-bold text-sm ${tx.type === TransactionType.INCOME ? 'text-accent-green' : 'text-primary'}`}>
                                {tx.type === TransactionType.EXPENSE ? '-' : '+'}{tx.amount}
                            </span>
                        </div>
                    ))}
                     {transactions.length === 0 && <p className="text-center text-gray-400 py-8">No transactions yet.</p>}
                </motion.div>
            ) : (
                <motion.div 
                    key="categories"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                >
                     {categoryData.map(([category, amount], index) => (
                        <div key={category} className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-accent-blue flex items-center justify-center font-bold text-xs">
                                    {index + 1}
                                </div>
                                <p className="text-sm font-bold text-primary">{category}</p>
                            </div>
                            <span className="font-bold text-sm text-primary">{amount} EGP</span>
                        </div>
                    ))}
                    {categoryData.length === 0 && <p className="text-center text-gray-400 py-8">No spending data yet.</p>}
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActivityFeed;

