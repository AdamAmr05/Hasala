import React from 'react';
import { motion } from 'framer-motion';

interface CoinStackProps {
    totalSpent: number;
    budget: number;
    isLoading?: boolean;
}

const CoinStack: React.FC<CoinStackProps> = ({ totalSpent, budget, isLoading = false }) => {
    // 1. Calculate percentage (capped at 100% for visual stack height, but color logic handles overflow)
    const percentage = Math.min((totalSpent / budget) * 100, 100);
    const remaining = Math.max(0, budget - totalSpent);
    const isOverBudget = totalSpent > budget;

    // 2. Determine number of coins to render
    const MAX_COINS = 12;

    // Calculate how many coins should be "spent" (Red) vs "remaining" (Green)
    // If over budget, all coins are red.
    // If 0 spent, all coins are green.
    let redCoinsCount = 0;

    if (isOverBudget) {
        redCoinsCount = MAX_COINS;
    } else {
        redCoinsCount = Math.round((totalSpent / budget) * MAX_COINS);
    }

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-32 h-48 flex flex-col justify-end items-center">

                {/* Floating Badge */}
                {!isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-8 z-20 flex flex-col items-center"
                    >
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Remaining</span>
                        <span className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-primary'}`}>
                            {remaining.toLocaleString()} <span className="text-xs font-normal text-gray-400">EGP</span>
                        </span>
                    </motion.div>
                )}

                {/* The Stack */}
                <div className="coin-stack w-24">
                    {/* Ghost Coins (Background structure) */}
                    {Array.from({ length: MAX_COINS }).map((_, i) => (
                        <div
                            key={`ghost-${i}`}
                            className="coin coin-ghost absolute w-full"
                            style={{
                                bottom: `${i * 4}px`, // Fixed positions
                                zIndex: 0,
                                opacity: 0 // Hidden as requested
                            }}
                        />
                    ))}

                    {/* Active Coins (The actual fill) */}
                    {!isLoading && Array.from({ length: MAX_COINS }).map((_, i) => {
                        // Logic: Bottom coins are Red (spent), Top coins are Green (remaining)
                        // Stack builds from bottom (index 0) to top (index MAX-1)
                        // So if redCoinsCount is 3, indices 0, 1, 2 are Red. 3 to 11 are Green.

                        const isRed = i < redCoinsCount;
                        const colorClass = isRed ? 'coin-red' : 'coin-green';

                        return (
                            <motion.div
                                key={`active-${i}`}
                                initial={{ opacity: 0, y: -50, scale: 1.5 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    delay: i * 0.05,
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15
                                }}
                                className={`coin ${colorClass} absolute w-full`}
                                style={{
                                    bottom: `${i * 4}px`, // Match ghost positions
                                    zIndex: i + 1, // Sit on top of ghosts
                                }}
                            />
                        );
                    })}
                </div>
                {/* Base/Pedestal */}
                <div className="w-32 h-4 bg-gray-200/50 rounded-[100%] absolute bottom-0 blur-sm transform scale-y-50" />
            </div>

            <div className="text-center -mt-2">
                <p className="text-sm text-gray-500 font-medium">
                    {percentage.toFixed(0)}% of Budget Used
                </p>
            </div>
        </div>
    );
};

export default CoinStack;
