import React, { useState, useRef, useEffect } from 'react';
import {
  ChatMessage,
  ChatSender,
  Transaction,
  ToolCall,
} from '../../types';
import { chatApi } from '../../services/api';
import ChatWidget from './ChatWidget';

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: ChatSender.AI,
      text: "Ahlan! I'm Hasala. I can visualize your spending or help you add new expenses. Just tell me what you bought!",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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

    try {
      // Send to Gemini
      const response = await chatApi.send({
        message: userMsg.text,
        history: previousMessages,
      });

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
      <div className="bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white">
             H
           </div>
           <div>
             <h2 className="font-bold text-gray-900 text-lg tracking-tight">Hasala AI</h2>
             <p className="text-[11px] text-green-500 font-medium flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
             </p>
           </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-10 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col w-full ${msg.sender === ChatSender.USER ? 'items-end' : 'items-start'}`}
          >
            {/* Unified Bubble */}
            <div className={`
               px-4 py-3 shadow-sm text-[15px] leading-relaxed max-w-[90%] break-words
               ${msg.sender === ChatSender.USER 
                 ? 'bg-[#007AFF] text-white rounded-[22px] rounded-br-sm' 
                 : 'bg-white text-[#1C1C1E] rounded-[22px] rounded-bl-sm border border-gray-100'}
            `}>
               {/* 1. Render Text */}
               {msg.text && <span className="whitespace-pre-wrap block">{msg.text}</span>}

               {/* 2. Render Tools (Generative UI) */}
               {msg.toolCalls?.map((tool, index) => (
                  <ChatWidget 
                    key={`${msg.id}-tool-${index}`}
                    type={tool.name} 
                    transactions={transactions} 
                    budget={budget} 
                  />
               ))}
            </div>
            
            <span className={`text-[10px] text-gray-400 px-1 mt-1 ${msg.sender === ChatSender.USER ? 'text-right' : 'text-left'}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex justify-start w-full animate-pulse mb-4">
             <div className="bg-white px-4 py-4 rounded-[20px] rounded-bl-sm shadow-sm border border-gray-100 flex space-x-1.5 items-center">
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
               <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-28 pt-2 bg-gradient-to-t from-[#F2F2F7] to-transparent">
        <div className="bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-1.5 flex items-center border border-gray-200/80 backdrop-blur-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Hasala..."
            className="flex-1 bg-transparent px-4 py-2.5 focus:outline-none text-gray-800 placeholder-gray-400 text-[15px]"
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-[#007AFF] text-white p-3 rounded-full shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:shadow-none transition-all transform hover:scale-105 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;