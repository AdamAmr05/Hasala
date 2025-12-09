import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Calculator, Lightbulb, Sparkles } from 'lucide-react';

const ThinkingIndicator: React.FC = () => {
    const [step, setStep] = useState(0);

    const steps = [
        { text: "Analyzing spending patterns...", icon: <Search size={14} /> },
        { text: "Crunching the numbers...", icon: <Calculator size={14} /> },
        { text: "Checking your budget health...", icon: <Brain size={14} /> },
        { text: "Formulating advice...", icon: <Lightbulb size={14} /> },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex justify-start w-full mb-4">
            <div className="flex flex-col gap-2 max-w-[80%]">
                {/* Label */}
                <div className="flex items-center gap-2 text-gray-400 text-xs ml-1">
                    <Sparkles size={12} className="text-purple-500 animate-pulse" />
                    <span className="font-bold text-purple-500 uppercase tracking-wider text-[10px]">
                        Hasala AI is Reasoning
                    </span>
                </div>

                {/* Spinner and Text Row */}
                <div className="flex items-center gap-3">
                    {/* Animated Brain/Loader */}
                    <div className="relative w-8 h-8 flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-2 border-purple-100 dark:border-purple-900 border-t-purple-500"
                        />
                        <motion.div
                            key={step}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="text-purple-500"
                        >
                            {steps[step].icon}
                        </motion.div>
                    </div>

                    {/* Text Carousel */}
                    <div className="h-5 overflow-hidden flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={step}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="text-xs font-bold text-gray-500 dark:text-gray-300 whitespace-nowrap"
                            >
                                {steps[step].text}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThinkingIndicator;
