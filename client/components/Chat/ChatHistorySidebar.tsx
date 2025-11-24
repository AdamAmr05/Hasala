import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, X, Plus } from 'lucide-react';
import { ChatThread } from '../../services/api';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    threads: ChatThread[];
    activeThreadId: string | null;
    onSelectThread: (threadId: string) => void;
    onNewChat: () => void;
    onDeleteThread: (threadId: string) => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    isOpen,
    onClose,
    threads,
    activeThreadId,
    onSelectThread,
    onNewChat,
    onDeleteThread,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black z-40 lg:hidden"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-[#1C1C1E] z-50 shadow-2xl flex flex-col"
                    >
                        <div className="p-5 border-b border-gray-100 dark:border-[#2C2C2E] flex justify-between items-center bg-gray-50/50 dark:bg-[#0D0D0F]/50">
                            <h2 className="font-bold text-lg text-gray-800 dark:text-white">Chat History</h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full text-gray-500 dark:text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            <button
                                onClick={() => {
                                    onNewChat();
                                    onClose();
                                }}
                                className="w-full py-3 px-4 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold shadow-lg shadow-primary/20 dark:shadow-white/20 flex items-center justify-center gap-2 hover:bg-blue-700 dark:hover:bg-gray-200 transition-colors"
                            >
                                <Plus size={18} />
                                New Chat
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {threads.length === 0 ? (
                                <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                                    <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No history yet.</p>
                                </div>
                            ) : (
                                threads.map((thread) => (
                                    <div
                                        key={thread._id}
                                        className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${activeThreadId === thread._id
                                            ? 'bg-blue-50 dark:bg-white/10 border-blue-200 dark:border-white/30 border'
                                            : 'hover:bg-gray-50 dark:hover:bg-[#2C2C2E] border border-transparent'
                                            }`}
                                        onClick={() => {
                                            onSelectThread(thread._id);
                                            onClose();
                                        }}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activeThreadId === thread._id ? 'bg-blue-100 dark:bg-white/20 text-primary dark:text-white' : 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400'
                                                }`}>
                                                <MessageSquare size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-medium truncate ${activeThreadId === thread._id ? 'text-primary dark:text-white' : 'text-gray-700 dark:text-gray-200'
                                                    }`}>
                                                    {thread.title}
                                                </p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                                    {new Date(thread.lastMessageAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to delete this chat?')) {
                                                    onDeleteThread(thread._id);
                                                }
                                            }}
                                            className="p-1.5 text-gray-300 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ChatHistorySidebar;
