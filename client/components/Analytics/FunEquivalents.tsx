import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Sandwich, CupSoda, Beef } from 'lucide-react';

interface FunEquivalentsProps {
    totalSpent: number;
}

const EQUIVALENTS = [
    {
        id: 'fool',
        name: 'Fool Sandwiches',
        price: 10,
        icon: <Sandwich size={24} className="text-green-600 dark:text-green-400" />,
        gradient: 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20',
        textColor: 'text-green-800 dark:text-green-300',
    },
    {
        id: 'cane',
        name: '3aseer Asab',
        price: 15,
        icon: <CupSoda size={24} className="text-yellow-600 dark:text-yellow-400" />,
        gradient: 'from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20',
        textColor: 'text-yellow-800 dark:text-yellow-300',
    },
    {
        id: 'koshary',
        name: 'Koshary Bowls',
        price: 50,
        icon: <Utensils size={24} className="text-orange-600 dark:text-orange-400" />,
        gradient: 'from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-900/20',
        textColor: 'text-orange-800 dark:text-orange-300',
    },
    {
        id: 'shawerma',
        name: 'Shawerma',
        price: 100,
        icon: <Beef size={24} className="text-red-600 dark:text-red-400" />,
        gradient: 'from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20',
        textColor: 'text-red-800 dark:text-red-300',
    }
];

const FunEquivalents: React.FC<FunEquivalentsProps> = ({ totalSpent }) => {
    return (
        <div className="space-y-3">
            <div className="px-6 flex items-baseline justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Fun Facts</h3>
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Your total equivalent in...</span>
            </div>

            <div className="flex overflow-x-auto px-6 gap-3 pb-4 no-scrollbar">
                {EQUIVALENTS.map((item, index) => {
                    const count = Math.floor(totalSpent / item.price);

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                            className={`min-w-[140px] p-4 rounded-2xl bg-gradient-to-br ${item.gradient} flex flex-col justify-between border border-white/50 dark:border-white/5 shadow-sm`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                                    {item.icon}
                                </div>
                            </div>

                            <div>
                                <h4 className={`text-3xl font-black ${item.textColor} tracking-tight`}>
                                    {count.toLocaleString()}
                                </h4>
                                <p className={`text-xs font-bold ${item.textColor} opacity-80 uppercase tracking-wide mt-1`}>
                                    {item.name}
                                </p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default FunEquivalents;
