import React from 'react';
import { TrendingUp, Lightbulb, PiggyBank, Sparkles } from 'lucide-react';

interface SuggestionButtonsProps {
    onSelect: (question: string) => void;
}

const suggestions = [
    {
        icon: <Sparkles size={16} />,
        text: "Give me a complete financial health check with personalized advice",
        description: "Full analysis"
    },
    {
        icon: <TrendingUp size={16} />,
        text: "What are my biggest spending habits this month?",
        description: "Analyze patterns"
    },
    {
        icon: <Lightbulb size={16} />,
        text: "Where can I realistically cut back and save more?",
        description: "Get smart tips"
    },
    {
        icon: <PiggyBank size={16} />,
        text: "Am I on track to meet my savings goals?",
        description: "Check progress"
    }
];

const SuggestionButtons: React.FC<SuggestionButtonsProps> = ({ onSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-3 pt-2 pb-8 px-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider font-medium">
                Try asking
            </p>
            {suggestions.map((suggestion, index) => (
                <button
                    key={index}
                    onClick={() => onSelect(suggestion.text)}
                    className="w-full max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl 
            bg-white dark:bg-[#1C1C1E] 
            border border-gray-100 dark:border-[#2C2C2E] 
            hover:border-purple-200 dark:hover:border-purple-900
            hover:bg-purple-50/50 dark:hover:bg-purple-900/10
            shadow-sm hover:shadow-md
            transition-all duration-200 group text-left"
                >
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                        {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            {suggestion.text}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {suggestion.description}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default SuggestionButtons;
