import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  ChatSender,
  Transaction,
  ToolCall,
} from '../../types';
import { chatApi, ChatThread } from '../../services/api';
import ChatWidget from './ChatWidget';
import ChatHistorySidebar from './ChatHistorySidebar';
import { Send, Sparkles, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch threads on mount
  useEffect(() => {
    loadThreads();
  }, []);

  // Fetch messages when thread changes
  useEffect(() => {
    if (activeThreadId) {
      loadMessages(activeThreadId);
    } else {
      // New Chat State
      setMessages([{
        id: 'welcome',
        sender: ChatSender.AI,
        text: "Ahlan! I'm Hasala. I can visualize your spending or help you add new expenses. Just tell me what you bought!",
        timestamp: Date.now()
      }]);
    }
  }, [activeThreadId]);

  const loadThreads = async () => {
    try {
      const data = await chatApi.getThreads();
      setThreads(data);
    } catch (error) {
      console.error('Failed to load threads', error);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const data = await chatApi.getMessages(threadId);
      // Map API messages to UI messages
      const uiMessages: ChatMessage[] = data.map((msg: any) => ({
        id: msg._id,
        sender: msg.role === 'user' ? ChatSender.USER : ChatSender.AI,
        text: msg.text,
        timestamp: new Date(msg.createdAt).getTime(),
        toolCalls: msg.toolCalls
      }));
      setMessages(uiMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await chatApi.deleteThread(threadId);
      setThreads(prev => prev.filter(t => t._id !== threadId));
      if (activeThreadId === threadId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete thread', error);
    }
  };

  // Only scroll when user types or explicitly sends
  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const previousMessages = [...messages];
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: ChatSender.USER,
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Scroll immediately when user sends
    setTimeout(scrollToBottom, 10);

    try {
      // Send to Gemini
      const response = await chatApi.send({
        message: userMsg.text,
        history: previousMessages.filter(m => m.id !== 'welcome'), // Exclude welcome message
        threadId: activeThreadId || undefined,
        clientTimestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      // Update active thread if it was a new chat
      if (!activeThreadId && response.threadId) {
        setActiveThreadId(response.threadId);
        loadThreads(); // Refresh list to show new thread title
      }

      const finalText =
        response.text || (response.toolCalls ? 'Here is what I found:' : "I'm not sure.");

      const visualTools: ToolCall[] =
        response.toolCalls?.filter((tool) => tool.name?.startsWith('render')) ?? [];

      if (response.createdTransactions?.length) {
        onAddTransaction();
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: ChatSender.AI,
        text: finalText,
        timestamp: Date.now(),
        toolCalls: visualTools.length > 0 ? visualTools : undefined
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: ChatSender.AI,
        text: "Sorry, I had a glitch. Try again?",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

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
          <div
            key={msg.id}
            className={`flex flex-col w-full ${msg.sender === ChatSender.USER ? 'items-end' : 'items-start'}`}
          >
            {/* Unified Bubble (Text Only) */}
            {msg.text && (
              <div className={`
                 text-[15px] leading-relaxed max-w-[90%] break-words mb-1
                 ${msg.sender === ChatSender.USER
                  ? 'bg-accent-blue text-white rounded-[22px] rounded-br-sm px-4 py-3 shadow-sm'
                  : 'text-primary dark:text-white px-1'}
              `}>
                <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                      strong: ({ node, ...props }) => <span className="font-bold text-gray-900 dark:text-white" {...props} />,
                      em: ({ node, ...props }) => <span className="italic text-gray-800 dark:text-gray-200" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* 2. Render Tools (Generative UI) - Outside Bubble for Full Width */}
            {msg.toolCalls?.map((tool, index) => (
              <div key={`${msg.id}-tool-${index}`} className="w-full max-w-[90%] mb-2">
                <ChatWidget
                  type={tool.name}
                  transactions={transactions}
                  budget={budget}
                  data={tool.args}
                />
              </div>
            ))}

            <span className={`text-[10px] text-gray-400 dark:text-gray-500 px-1 mt-1 ${msg.sender === ChatSender.USER ? 'text-right' : 'text-left'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start w-full animate-pulse mb-4">
            <div className="bg-white dark:bg-[#1C1C1E] px-4 py-4 rounded-[20px] rounded-bl-sm shadow-sm border border-gray-100 dark:border-[#2C2C2E] flex space-x-1.5 items-center">
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-[#F2F2F7] dark:from-[#0D0D0F] to-transparent">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-xl dark:shadow-black/30 p-1.5 flex items-center border border-gray-200/80 dark:border-[#2C2C2E] backdrop-blur-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Hasala..."
            className="flex-1 bg-transparent px-4 py-2.5 focus:outline-none text-primary dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-[15px]"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-accent-blue text-white p-3 rounded-full shadow-lg shadow-blue-500/30 hover:bg-blue-600 disabled:opacity-50 disabled:shadow-none transition-all transform hover:scale-105 active:scale-95"
          >
            <Send size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div >
  );
};

export default ChatInterface;
