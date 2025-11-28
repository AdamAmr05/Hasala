import React from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, disabled }) => {
    return (
        <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-[#F2F2F7] dark:from-[#0D0D0F] to-transparent">
            <div className="bg-white dark:bg-[#1C1C1E] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-xl dark:shadow-black/30 p-1.5 flex items-center border border-gray-200/80 dark:border-[#2C2C2E] backdrop-blur-sm">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !disabled && onSend()}
                    placeholder="Ask Hasala..."
                    className="flex-1 bg-transparent px-4 py-2.5 focus:outline-none text-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px]"
                    disabled={disabled}
                />
                <button
                    onClick={onSend}
                    disabled={!value.trim() || disabled}
                    className="bg-accent-blue text-white p-3 rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-600 disabled:opacity-50 disabled:shadow-none transition-all transform hover:scale-105 active:scale-95"
                >
                    <Send size={18} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
