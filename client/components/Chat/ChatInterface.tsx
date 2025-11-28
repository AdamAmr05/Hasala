import React, { useRef, useEffect } from 'react';
import { Transaction } from '../../types';
import ChatHistorySidebar from './ChatHistorySidebar';
import { Sparkles, History } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatInterfaceProps {
  transactions: Transaction[];
  budget: number;
  onAddTransaction: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  transactions,
  budget,
  onAddTransaction,
}) => {
  const {
    messages,
    threads,
    activeThreadId,
    isSidebarOpen,
    inputValue,
    isTyping,
    setInputValue,
    setIsSidebarOpen,
    setActiveThreadId,
    handleNewChat,
    handleDeleteThread,
    handleSend
  } = useChat({ onAddTransaction });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll on new messages or typing
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl px-6 py-4 border-b border-gray-200 dark:border-[#2C2C2E] sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary dark:bg-white flex items-center justify-center text-white dark:text-primary font-bold shadow-sm ring-2 ring-white dark:ring-[#0D0D0F]">
            <Sparkles size={18} className="text-white dark:text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-primary dark:text-white text-lg tracking-tight">Hasala AI</h2>
            {activeThreadId && <p className="text-[10px] text-gray-400 dark:text-gray-500">Continuing conversation...</p>}
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] rounded-full text-gray-500 dark:text-gray-400 transition-colors"
        >
          <History size={20} />
        </button>
      </div>

      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-10 space-y-6 scroll-smooth no-scrollbar">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            transactions={transactions}
            budget={budget}
          />
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isTyping}
      />
    </div >
  );
};

export default ChatInterface;
