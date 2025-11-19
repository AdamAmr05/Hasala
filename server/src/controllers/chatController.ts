import { Request, Response } from 'express';
import { GoogleGenAI, Content } from '@google/genai';
import Transaction, { Category, ITransaction, TransactionType } from '../models/Transaction';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChatRequestBody, ChatSender, ToolCall } from '../types/chat';
import {
  MODEL_NAME,
  TRANSACTION_SCHEMA,
  addTransactionTool,
  renderBudgetOverviewTool,
  renderCategoryBreakdownTool,
  renderMonthlyProjectionTool,
  renderRecentTransactionsTool,
  renderSpendingChartTool,
} from '../utils/geminiConfig';

const buildSystemInstruction = (
  transactions: ITransaction[],
  userName?: string,
  budget?: number,
) => {
  const totalSpent = transactions
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const summary = transactions
    .slice(0, 15)
    .map(
      (t) => `${t.date.toISOString().split('T')[0]}: ${t.description} (${t.amount} EGP) - ${t.category}`,
    )
    .join('\n');

  return `
You are Hasala AI, a financial assistant for ${userName || 'an Egyptian student'}.

CONTEXT:
Monthly Budget: ${budget ?? 'Not set'} EGP
Total Spent (tracked): ${totalSpent} EGP
Recent Transactions:
${summary}

INSTRUCTIONS:
1. Persona: Friendly, encouraging, uses light Egyptian Arabic slang ("Ahlan", "Tamam") when natural.
2. If the user asks for patterns, history, or budget status, respond with the appropriate render tool rather than only text.
3. If the user wants to log something, call the addTransaction tool with structured JSON.
4. Keep responses concise (under 90 words) unless the user explicitly asks for detail.`;
};

const mapHistoryToContents = (history: ChatRequestBody['history'] = []): Content[] => {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-10)
    .filter((msg) => msg?.text && msg?.sender)
    .map((msg) => ({
      role: msg.sender === ChatSender.USER ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));
};

const executeToolCalls = async (
  toolCalls: ToolCall[],
  userId: string,
): Promise<{ toolCalls: ToolCall[]; createdTransactions: ITransaction[] }> => {
  if (!toolCalls.length) {
    return { toolCalls, createdTransactions: [] };
  }

  const createdTransactions: ITransaction[] = [];
  const additionalToolCalls: ToolCall[] = [];

  for (const toolCall of toolCalls) {
    if (toolCall.name !== 'addTransaction') continue;

    const args = toolCall.args || {};
    const amount =
      typeof args.amount === 'number' ? args.amount : Number(args.amount ?? 0);
    const description = typeof args.description === 'string' ? args.description : '';
    const category = (typeof args.category === 'string'
      ? args.category
      : Category.OTHER) as Category;
    const type = (typeof args.type === 'string'
      ? args.type
      : TransactionType.EXPENSE) as TransactionType;
    const providedDate =
      typeof args.date === 'string' || args.date instanceof Date ? args.date : undefined;

    const created = await Transaction.create({
      user: userId,
      amount,
      description,
      category,
      type,
      date: providedDate ? new Date(providedDate) : new Date(),
      isRecurring: Boolean(args.isRecurring),
    });

    createdTransactions.push(created);
    additionalToolCalls.push({
      name: 'renderRecentTransactions',
      args: { highlightTransactionId: created._id.toString() },
    });
  }

  return { toolCalls: [...toolCalls, ...additionalToolCalls], createdTransactions };
};

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { message, history }: ChatRequestBody = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'GEMINI_API_KEY is not configured.' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'User context is required.' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(20);

    const contents = mapHistoryToContents(history);
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(transactions, req.user.name, req.user.budget),
        tools: [
          {
            functionDeclarations: [
              addTransactionTool,
              renderSpendingChartTool,
              renderRecentTransactionsTool,
              renderBudgetOverviewTool,
              renderCategoryBreakdownTool,
              renderMonthlyProjectionTool,
            ],
          },
        ],
      },
    });

    const text = response.text || '';
    const rawToolCalls: ToolCall[] =
      response.functionCalls
        ?.filter((call) => Boolean(call.name))
        .map((call) => ({
          name: call.name as string,
          args: (call.args as Record<string, unknown>) || {},
        })) || [];

    const { toolCalls, createdTransactions } = await executeToolCalls(rawToolCalls, req.user._id.toString());

    return res.json({
      text,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      createdTransactions: createdTransactions.length
        ? createdTransactions.map((tx) => ({
          id: tx._id.toString(),
          amount: tx.amount,
          description: tx.description,
          category: tx.category,
          type: tx.type,
          date: tx.date.toISOString(),
        }))
        : undefined,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ message: 'Ma3lesh, I had trouble connecting to Hasala AI.' });
  }
};

