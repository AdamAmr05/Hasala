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
  budget: number = 0,
  existingPeople: string[] = [],
) => {
  // 1. Basic Totals
  const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE);
  const income = transactions.filter((t) => t.type === TransactionType.INCOME);

  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const effectiveBudget = budget + totalIncome;
  const remaining = effectiveBudget - totalSpent;

  // 2. Budget Health
  let healthStatus = 'Healthy';
  if (remaining < 0) healthStatus = 'Critical (Over Budget)';
  else if (remaining < effectiveBudget * 0.2) healthStatus = 'Low (Caution)';

  // 3. Top Category
  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)[0];
  const topCategoryName = topCategory ? topCategory[0] : 'None';
  const topCategoryAmount = topCategory ? topCategory[1] : 0;

  // 4. Projections
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyAverage = totalSpent / Math.max(1, dayOfMonth);
  const projectedTotal = dailyAverage * daysInMonth;

  const summary = transactions
    .slice(0, 15)
    .map(
      (t) => `${t.date.toISOString().split('T')[0]}: ${t.description} (${t.amount} EGP) - ${t.category}`,
    )
    .join('\n');

  const peopleContext = existingPeople.length > 0
    ? `Existing people this month: ${existingPeople.join(', ')}.`
    : 'No people tracked yet this month.';

  return `
You are Hasala AI, a witty, insightful, and friendly financial companion for ${userName || 'friend'}.
Your goal is to help the user understand their financial habits, not just report numbers.

RICH CONTEXT (Use this to give specific advice):
- Budget Status: ${healthStatus}
- Remaining: ${remaining.toLocaleString()} / ${effectiveBudget.toLocaleString()} EGP
- Top Spending: ${topCategoryName} (${topCategoryAmount.toLocaleString()} EGP)
- Daily Average: ~${Math.round(dailyAverage)} EGP/day
- End-of-Month Projection: ${Math.round(projectedTotal).toLocaleString()} EGP (Limit: ${effectiveBudget.toLocaleString()})
- ${peopleContext}

INSTRUCTIONS:
1. **Be a Financial Advisor**: Don't just say "Here is your chart." Explain the *why*.
   - If they are overspending, warn them kindly and suggest cutting back on ${topCategoryName}.
   - If they are safe, celebrate their good habits!
   - Use the "Projection" to warn them about the future if they keep spending like this.
2. **Conversational Style**: Use natural, encouraging language. You can use light Egyptian slang ("Ya basha", "Ahlan", "Tamam", "Ma3lesh") to sound local and friendly.
3. **Visuals are Supplementary**:
   - ALWAYS explain the insight in text FIRST.
   - THEN use a tool (chart) to *visualize* what you just explained.
   - Example: "You've spent a lot on Food this week. Here's a breakdown:" -> [renderCategoryBreakdown]
4. **Tools**:
   - Use 'addTransaction' when user wants to add a transaction. If they mention a person, use the 'relatedPerson' field. Match to existing people if possible.
   - Use 'renderBudgetOverview' when discussing overall status or limits.
   - Use 'renderCategoryBreakdown' when discussing *where* money went.
   - Use 'renderMonthlyProjection' when discussing the *future* or if they will make it to the end of the month.
   - Use 'renderSpendingChart' for trends over the last few days.
   - Use 'renderRecentTransactions' when the user asks about specific recent purchases or history.
5. **Conciseness**: Keep it punchy and helpful. Avoid long lectures.
`;
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
    const relatedPerson = typeof args.relatedPerson === 'string' ? args.relatedPerson : undefined;

    const created = await Transaction.create({
      user: userId,
      amount,
      description,
      category,
      type,
      date: providedDate ? new Date(providedDate) : new Date(),
      isRecurring: Boolean(args.isRecurring),
      relatedPerson,
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

    // Fetch existing people for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startOfMonth },
      relatedPerson: { $exists: true, $ne: null },
    }).select('relatedPerson');

    const existingPeople = Array.from(new Set(monthlyTransactions.map((t) => t.relatedPerson).filter(Boolean))) as string[];

    const contents = mapHistoryToContents(history);
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: buildSystemInstruction(transactions, req.user.name, req.user.budget, existingPeople),
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

