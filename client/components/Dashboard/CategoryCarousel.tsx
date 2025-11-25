import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Category } from '../../types';
import { X } from 'lucide-react';

interface CategoryData {
    _id: string;
    total: number;
}

interface CategoryCarouselProps {
    categories: CategoryData[];
    totalSpent: number;
    onBack: () => void;
}

const COLORS: Record<string, string> = {
    [Category.FOOD]: 'bg-orange-500',
    [Category.TRANSPORT]: 'bg-blue-500',
    [Category.ENTERTAINMENT]: 'bg-purple-500',
    [Category.SHOPPING]: 'bg-pink-500',
    [Category.BILLS]: 'bg-red-500',
    [Category.EDUCATION]: 'bg-indigo-500',
    [Category.INCOME]: 'bg-green-500',
    [Category.SALARY]: 'bg-green-600',
    [Category.GIVING]: 'bg-teal-500',
    [Category.HOUSING]: 'bg-cyan-500',
    [Category.OTHER]: 'bg-gray-500',
};

const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ categories, totalSpent, onBack }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    // Sort categories by total spent (descending)
    const sortedCategories = [...categories].sort((a, b) => b.total - a.total);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
            // Swipe Left -> Next Card
            if (activeIndex < sortedCategories.length - 1) {
                setDirection(1);
                setActiveIndex(activeIndex + 1);
            }
        } else if (info.offset.x > swipeThreshold) {
            // Swipe Right -> Previous Card
            if (activeIndex > 0) {
                setDirection(-1);
                setActiveIndex(activeIndex - 1);
            }
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.8,
            rotateZ: direction > 0 ? 5 : -5, // Slight tilt on enter
            zIndex: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            rotateZ: 0,
            zIndex: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            scale: 0.8,
            rotateZ: direction < 0 ? 5 : -5, // Slight tilt on exit
            zIndex: 0,
        }),
    };

    if (sortedCategories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <p>No spending data yet.</p>
                <button onClick={onBack} className="mt-4 text-primary font-medium">
                    Exit
                </button>
            </div>
        );
    }

    const activeCategory = sortedCategories[activeIndex];
    const percentage = ((activeCategory.total / totalSpent) * 100).toFixed(1);
    const colorClass = COLORS[activeCategory._id] || 'bg-gray-500';

    return (
        <div className="flex flex-col items-center justify-center pt-2 pb-2 relative w-full overflow-hidden">

            <div className="h-52 w-full flex items-center justify-center relative perspective-1000">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={activeCategory._id}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 200, damping: 25 },
                            opacity: { duration: 0.3 },
                            scale: { duration: 0.3 },
                            rotateZ: { duration: 0.3 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.7}
                        onDragEnd={handleDragEnd}
                        style={{ touchAction: "pan-y" }}
                        className={`absolute w-32 h-52 rounded-2xl shadow-xl ${colorClass} flex flex-col items-center justify-between p-4 text-white cursor-grab active:cursor-grabbing border border-white/10`}
                    >
                        <div className="text-2xl font-bold opacity-20 absolute top-2 right-2">
                            #{activeIndex + 1}
                        </div>

                        <div className="mt-6 text-center">
                            <div className="text-4xl mb-1 drop-shadow-md">
                                {activeCategory._id[0]}
                            </div>
                            <h3 className="text-sm font-bold tracking-wide uppercase drop-shadow-sm truncate w-full px-1">
                                {activeCategory._id}
                            </h3>
                        </div>

                        <div className="text-center mb-3">
                            <div className="text-xl font-bold drop-shadow-sm">
                                {activeCategory.total.toLocaleString()}
                                <span className="text-xs font-normal opacity-80 ml-1">EGP</span>
                            </div>
                            <div className="text-[10px] font-medium opacity-90 mt-1">
                                {percentage}% of total expenses
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div className="flex gap-2 mt-2">
                {sortedCategories.map((_, idx) => (
                    <motion.div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full ${idx === activeIndex ? 'bg-primary dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'}`}
                        animate={{
                            scale: idx === activeIndex ? 1.5 : 1,
                            opacity: idx === activeIndex ? 1 : 0.5
                        }}
                    />
                ))}
            </div>

            {/* Non-intrusive Exit Button */}
            <button
                onClick={onBack}
                className="mt-2 flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                <X size={12} />
                Exit
            </button>
        </div>
    );
};

export default CategoryCarousel;
