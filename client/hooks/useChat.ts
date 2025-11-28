import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatSender, ToolCall } from '../types';
import { chatApi, ChatThread } from '../services/api';

interface UseChatProps {
    onAddTransaction: () => void;
}

export const useChat = ({ onAddTransaction }: UseChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

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
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const handleNewChat = useCallback(() => {
        setActiveThreadId(null);
        setIsSidebarOpen(false);
    }, []);

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

    return {
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
    };
};
