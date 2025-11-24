import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Coffee, Home, Car, Zap, MoreHorizontal, Loader2, HandHeart } from 'lucide-react';

interface ActivityFeedProps {
    transactions: Transaction[];
    categories?: { _id: string; total: number }[];
    onLoadMore: () => void;
    hasMore: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'Food': <Coffee size={18} />,
    'Shopping': <ShoppingBag size={18} />,
    'Housing': <Home size={18} />,
    'Transport': <Car size={18} />,
    'Utilities': <Zap size={18} />,
    'Giving': <HandHeart size={18} />,
    'Other': <MoreHorizontal size={18} />,
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({ transactions, categories, onLoadMore, hasMore }) => {
    const [activeTab, setActiveTab] = useState<'recent' | 'categories'>('recent');
    const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(10);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Reset visible categories when switching tabs or when categories change
    useEffect(() => {
        if (activeTab === 'categories') {
            setVisibleCategoriesCount(10);
        }
    }, [activeTab, categories]);

    // Prepare category data
    const allCategoryData = React.useMemo(() => {
        if (categories) {
            return categories.map(c => [c._id, c.total] as [string, number]);
        }
        // Fallback to deriving from transactions (legacy/fallback)
        return Object.entries(
            transactions
                .filter(t => t.type === TransactionType.EXPENSE)
                .reduce((acc: Record<string, number>, curr) => {
                    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                    return acc;
                }, {})
        ).sort(([, a]: [string, number], [, b]: [string, number]) => b - a);
    }, [categories, transactions]);

    const displayedCategories = allCategoryData.slice(0, visibleCategoriesCount);
    const hasMoreCategories = allCategoryData.length > visibleCategoriesCount;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    if (activeTab === 'recent' && hasMore) {
                        onLoadMore();
                    } else if (activeTab === 'categories' && hasMoreCategories) {
                        setVisibleCategoriesCount(prev => prev + 10);
                    }
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, onLoadMore, activeTab, hasMoreCategories]);

    return (
        <div className="px-6 pb-24">
            {/* Segmented Control */}
            <div className="bg-gray-200/50 dark:bg-[#2C2C2E] p-1 rounded-xl flex mb-6 relative">
                {/* Sliding Background */}
                <motion.div
                    className="absolute top-1 bottom-1 bg-white dark:bg-[#3A3A3C] rounded-[10px] shadow-sm z-0"
                    initial={false}
                    animate={{
                        left: activeTab === 'recent' ? '4px' : '50%',
                        width: 'calc(50% - 6px)'
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />

                <button
                    onClick={() => setActiveTab('recent')}
                    className={`flex-1 py-2 text-sm font-semibold z-10 relative transition-colors ${activeTab === 'recent' ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    Recent Activity
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex-1 py-2 text-sm font-semibold z-10 relative transition-colors ${activeTab === 'categories' ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
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
                            {transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === TransactionType.EXPENSE ? 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-300' : 'bg-green-50 dark:bg-green-500/10 text-accent-green'}`}>
                                            {CATEGORY_ICONS[tx.category] || <MoreHorizontal size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-primary dark:text-white">{tx.description}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${tx.type === TransactionType.INCOME ? 'text-accent-green' : 'text-primary dark:text-white'}`}>
                                        {tx.type === TransactionType.EXPENSE ? '-' : '+'}{tx.amount}
                                    </span>
                                </div>
                            ))}
                            {transactions.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">No transactions yet.</p>}

                            {/* Infinite Scroll Sentinel for Transactions */}
                            {hasMore && (
                                <div ref={observerTarget} className="flex justify-center py-4">
                                    <Loader2 className="animate-spin text-gray-400 dark:text-gray-500" size={20} />
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="categories"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {displayedCategories.map(([category, amount], index) => (
                                <div key={category} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-white/10 text-accent-blue dark:text-white flex items-center justify-center font-bold text-xs">
                                            {index + 1}
                                        </div>
                                        <p className="text-sm font-bold text-primary dark:text-white">{category}</p>
                                    </div>
                                    <span className="font-bold text-sm text-primary dark:text-white">{amount} EGP</span>
                                </div>
                            ))}
                            {allCategoryData.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8">No spending data yet.</p>}

                            {/* Infinite Scroll Sentinel for Categories */}
                            {hasMoreCategories && (
                                <div ref={observerTarget} className="flex justify-center py-4">
                                    <Loader2 className="animate-spin text-gray-400 dark:text-gray-500" size={20} />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActivityFeed;

