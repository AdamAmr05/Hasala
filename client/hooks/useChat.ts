import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatSender, ToolCall } from '../types';
import { chatApi, ChatThread } from '../services/api';

interface UseChatProps {
    onAddTransaction: () => void;
}

// 2. Strict Type Safety for API Responses
interface ApiChatMessage {
    _id: string;
    role: 'user' | 'model';
    text: string;
    createdAt: string;
    toolCalls?: ToolCall[];
}

export const useChat = ({ onAddTransaction }: UseChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Track if the current thread was created by us (to skip reload)
    const locallyCreatedThreadRef = useRef<string | null>(null);

    // 3. Stable Hooks Dependencies
    const loadThreads = useCallback(async () => {
        try {
            const data = await chatApi.getThreads();
            setThreads(data);
        } catch (error) {
            console.error('Failed to load threads', error);
        }
    }, []);

    const loadMessages = useCallback(async (threadId: string) => {
        try {
            const data = await chatApi.getMessages(threadId);
            // Map API messages to UI messages using strict interface
            const uiMessages: ChatMessage[] = (data as any[]).map((msg: ApiChatMessage) => ({
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
    }, []);

    // Fetch threads on mount
    useEffect(() => {
        loadThreads();
    }, [loadThreads]);

    // Fetch messages when thread changes (but skip if we just created it locally)
    useEffect(() => {
        if (activeThreadId) {
            // Skip reload if this thread was just created by us in handleSend
            if (locallyCreatedThreadRef.current === activeThreadId) {
                locallyCreatedThreadRef.current = null; // Reset for future switches
                return;
            }
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
    }, [activeThreadId, loadMessages]);

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

        // 1. Robust ID Generation
        const userMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

        const userMsg: ChatMessage = {
            id: userMsgId,
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
                // Mark as locally created to prevent the useEffect from reloading messages
                locallyCreatedThreadRef.current = response.threadId;
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

            const aiMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now() + 1).toString();

            const aiMsg: ChatMessage = {
                id: aiMsgId,
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
