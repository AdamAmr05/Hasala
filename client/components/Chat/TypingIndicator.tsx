import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex justify-start w-full animate-pulse mb-4">
            <div className="bg-white dark:bg-[#1C1C1E] px-4 py-4 rounded-[20px] rounded-bl-sm shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex space-x-1.5 items-center">
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-200"></div>
            </div>
        </div>
    );
};

export default TypingIndicator;
