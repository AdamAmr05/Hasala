import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, ChatSender, Transaction } from '../../types';
import ChatWidget from './ChatWidget';

interface MessageBubbleProps {
    message: ChatMessage;
    transactions: Transaction[];
    budget: number;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, transactions, budget }) => {
    return (
        <div
            className={`flex flex-col w-full ${message.sender === ChatSender.USER ? 'items-end' : 'items-start'}`}
        >
            {/* Unified Bubble (Text Only) */}
            {message.text && (
                <div className={`
           text-[15px] leading-relaxed max-w-[90%] break-words mb-1
           ${message.sender === ChatSender.USER
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
                            {message.text}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Render Tools (Generative UI) - Outside Bubble for Full Width */}
            {message.toolCalls?.map((tool, index) => (
                <div key={`${message.id}-tool-${index}`} className="w-full max-w-[90%] mb-2">
                    <ChatWidget
                        type={tool.name}
                        transactions={transactions}
                        budget={budget}
                        data={tool.args}
                    />
                </div>
            ))}

            <span className={`text-[10px] text-gray-400 dark:text-gray-500 px-1 mt-1 ${message.sender === ChatSender.USER ? 'text-right' : 'text-left'}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};

export default MessageBubble;
