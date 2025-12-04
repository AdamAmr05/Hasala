import { Request, Response } from 'express';
import { GoogleGenAI, Content } from '@google/genai';
import Transaction, { Category, ITransaction, TransactionType } from '../models/Transaction';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChatRequestBody, ChatSender, ToolCall } from '../types/chat';
import ChatThread from '../models/ChatThread';
import ChatMessage from '../models/ChatMessage';
import RecurringTransaction from '../models/RecurringTransaction';
// Amounts are stored directly as decimals - no conversion needed
import {
  MODEL_NAME,
  TRANSACTION_SCHEMA,
  addTransactionTool,
  renderBudgetOverviewTool,
  renderCategoryBreakdownTool,
  renderMonthlyProjectionTool,
  renderRecentTransactionsTool,
  renderSpendingChartTool,
  renderPeopleBreakdownTool,
  renderIncomeOverviewTool,
  renderRecurringExpensesTool,
  renderSavingsOverviewTool,
} from '../utils/geminiConfig';
import { TransactionService } from '../services/transactionService';
import SavingsGoal from '../models/SavingsGoal';

const buildSystemInstruction = (
  transactions: ITransaction[],
  userName?: string,
  budget: number = 0,
  peopleStats: string = '',
  realTotalSpent: number = 0,
  realTotalIncome: number = 0,
  upcomingLiabilities: string = '',
  savingsContext: string = '',
) => {
  // 1. Basic Totals
  const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE);

  // Use real totals if provided (which they should be), otherwise fallback to slice (legacy behavior safety)
  const totalSpent = realTotalSpent > 0 ? realTotalSpent : expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = realTotalIncome > 0 ? realTotalIncome : 0; // Income might be 0, that's fine

  const effectiveBudget = budget > 0 ? budget : totalIncome; // Use budget if set, otherwise income
  const remaining = effectiveBudget - totalSpent;
  const remainingIncome = totalIncome - totalSpent;

  // 2. Budget Health
  let healthStatus = 'Healthy';
  if (remaining < 0) healthStatus = 'Critical (Over Budget Goal)';
  else if (remaining < effectiveBudget * 0.2) healthStatus = 'Low (Caution)';

  // 3. Top Category (transaction amounts are stored as decimals)
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
      (t) => `${t.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${t.description} (${t.amount} EGP) - ${t.category}`,
    )
    .join('\n');

  const peopleContext = peopleStats
    ? `People tracked this month: ${peopleStats}.`
    : 'No people tracked yet this month.';

  return `
You are Hasala AI, a witty, insightful, and friendly financial companion for ${userName || 'friend'}.
Your goal is to help the user understand their financial habits, not just report numbers.

RICH CONTEXT (Use this to give specific advice):
- Budget Goal: ${budget > 0 ? `${budget.toLocaleString()} EGP` : 'Not set (using Income)'}
- Total Income: ${totalIncome.toLocaleString()} EGP
- Total Spent: ${totalSpent.toLocaleString()} EGP
- Remaining (vs Goal): ${remaining.toLocaleString()} EGP
- Remaining (vs Income): ${remainingIncome.toLocaleString()} EGP
- Budget Status: ${healthStatus}
- Top Spending: ${topCategoryName} (${topCategoryAmount.toLocaleString()} EGP)
- Daily Average: ~${Math.round(dailyAverage)} EGP/day
- End-of-Month Projection: ${Math.round(projectedTotal).toLocaleString()} EGP (Limit: ${effectiveBudget.toLocaleString()})
- Upcoming Recurring Bills (This Month): ${upcomingLiabilities || 'None'}
- Savings Status: ${savingsContext || 'No active savings goals.'}
- ${peopleContext}

INSTRUCTIONS:
1. **Be a Financial Advisor**: Don't just say "Here is your chart." Explain the *why*.
   - Compare their spending to BOTH their Income and their Budget Goal.
   - If they are under their Budget Goal but over their Income, warn them!
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
   - Use 'renderPeopleBreakdown' when the user asks about money given to people, who they support, or their 'Giving' history.
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
  clientTimestamp?: string,
): Promise<{ toolCalls: ToolCall[]; createdTransactions: ITransaction[] }> => {
  if (!toolCalls.length) {
    return { toolCalls, createdTransactions: [] };
  }

  const createdTransactions: ITransaction[] = [];
  const additionalToolCalls: ToolCall[] = [];

  for (const toolCall of toolCalls) {
    if (toolCall.name !== 'addTransaction') continue;

    const args = toolCall.args || {};

    // Handle Bulk (Array) or Single (Legacy/Fallback)
    let transactionsToAdd: any[] = [];

    if (Array.isArray(args.transactions)) {
      transactionsToAdd = args.transactions;
    } else {
      // Fallback if model sends single object despite schema
      transactionsToAdd = [args];
    }

    for (const tx of transactionsToAdd) {
      const amount = typeof tx.amount === 'number' ? tx.amount : Number(tx.amount ?? 0);
      const description = typeof tx.description === 'string' ? tx.description : '';
      const category = (typeof tx.category === 'string' ? tx.category : Category.OTHER) as Category;
      const type = (typeof tx.type === 'string' ? tx.type : TransactionType.EXPENSE) as TransactionType;
      const providedDate = typeof tx.date === 'string' || tx.date instanceof Date ? tx.date : undefined;
      const relatedPerson = typeof tx.relatedPerson === 'string' ? tx.relatedPerson : undefined;

      const created = await TransactionService.createTransaction({
        user: userId,
        amount,
        description,
        category,
        type,
        date: providedDate ? new Date(providedDate) : (clientTimestamp ? new Date(clientTimestamp) : new Date()),
        isRecurring: Boolean(tx.isRecurring),
        relatedPerson,
      });

      createdTransactions.push(created);
    }

    // Add ONE render call for all added transactions
    if (transactionsToAdd.length > 0) {
      additionalToolCalls.push({
        name: 'renderRecentTransactions',
        args: { highlightTransactionId: createdTransactions[createdTransactions.length - 1]._id.toString() },
      });
    }
  }

  return { toolCalls: [...toolCalls, ...additionalToolCalls], createdTransactions };
};

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { message, history, threadId, clientTimestamp }: ChatRequestBody = req.body;

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

    // 1. Build Context (Lightweight)
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(20);

    // Fetch existing people for the current month
    const startOfCurrentMonth = new Date();
    startOfCurrentMonth.setDate(1);
    startOfCurrentMonth.setHours(0, 0, 0, 0);

    const monthlyTransactions = await Transaction.find({
      user: req.user._id,
      date: { $gte: startOfCurrentMonth },
      relatedPerson: { $exists: true, $ne: null },
    }).select('relatedPerson amount');

    const peopleMap = monthlyTransactions.reduce((acc, t) => {
      if (t.relatedPerson) {
        acc[t.relatedPerson] = (acc[t.relatedPerson] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const peopleStats = Object.entries(peopleMap)
      .map(([name, total]) => `${name}: ${total} EGP`)
      .join(', ');

    // Calculate Upcoming Recurring Expenses
    const recurringTransactions = await RecurringTransaction.find({ user: req.user._id, isActive: true });
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const upcomingBills = recurringTransactions.filter(transaction => {
      return transaction.dayOfMonth >= today.getDate() && transaction.type === 'EXPENSE';
    });

    const upcomingLiabilitiesTotal = upcomingBills.reduce((sum, exp) => sum + exp.amount, 0);
    const upcomingLiabilitiesText = upcomingBills.length > 0
      ? `${upcomingLiabilitiesTotal.toLocaleString()} EGP (${upcomingBills.map(b => `${b.description}: ${b.amount}`).join(', ')})`
      : '';

    // Calculate Savings Context
    const savingsGoals = await SavingsGoal.find({ userId: req.user._id });
    const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const topGoals = savingsGoals
      .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount))
      .slice(0, 3)
      .map(g => `${g.name}: ${g.currentAmount}/${g.targetAmount} (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)`)
      .join(', ');

    const savingsContext = savingsGoals.length > 0
      ? `Total Saved: ${totalSaved.toLocaleString()} / ${totalTarget.toLocaleString()} EGP. Top Goals: ${topGoals}.`
      : 'No active savings goals.';

    // --- PERSISTENCE START ---
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const newThread = await ChatThread.create({
        user: req.user._id,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      });
      currentThreadId = newThread._id.toString();
    }

    // Save User Message
    await ChatMessage.create({
      thread: currentThreadId,
      role: 'user',
      text: message,
    });

    await ChatThread.findByIdAndUpdate(currentThreadId, { lastMessageAt: new Date() });
    // --- PERSISTENCE END ---

    // Load history
    let contents: Content[] = [];
    if (currentThreadId) {
      const dbMessages = await ChatMessage.find({ thread: currentThreadId })
        .sort({ createdAt: 1 })
        .limit(20);

      contents = dbMessages.map((msg) => {
        const parts = [];
        if (msg.text) {
          parts.push({ text: msg.text });
        }
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          const toolDescriptions = msg.toolCalls.map(tc => {
            if (tc.name === 'addTransaction') return `(I added a transaction: ${JSON.stringify(tc.args)})`;
            if (tc.name === 'renderSpendingChart') return `(I showed the spending chart)`;
            if (tc.name === 'renderBudgetOverview') return `(I showed the budget overview)`;
            if (tc.name === 'renderCategoryBreakdown') return `(I showed the category breakdown)`;
            if (tc.name === 'renderMonthlyProjection') return `(I showed the monthly projection)`;
            if (tc.name === 'renderPeopleBreakdown') return `(I showed the people breakdown)`;
            if (tc.name === 'renderIncomeOverview') return `(I showed the income overview)`;
            if (tc.name === 'renderRecentTransactions') return `(I showed recent transactions)`;
            return `(I used tool: ${tc.name})`;
          }).join(' ');
          parts.push({ text: toolDescriptions });
        }
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts,
        };
      });
    } else {
      contents = mapHistoryToContents(history);
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });
    }

    // Calculate accurate monthly totals for Context
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const totalSpentReal = monthlyStats.find((s) => s._id === TransactionType.EXPENSE)?.total || 0;
    const totalIncomeReal = monthlyStats.find((s) => s._id === TransactionType.INCOME)?.total || 0;

    const systemInstruction = buildSystemInstruction(
      transactions,
      req.user.name,
      req.user.budget,
      peopleStats,
      totalSpentReal,
      totalIncomeReal,
      upcomingLiabilitiesText,
      savingsContext
    );

    console.log('--- SYSTEM INSTRUCTION ---');
    console.log(systemInstruction);
    console.log('--------------------------');

    console.log('--- USER INPUT ---');
    console.log('Message:', message);
    console.log('History Length:', contents.length);
    console.log('------------------');

    const config = {
      systemInstruction,
      tools: [
        {
          functionDeclarations: [
            addTransactionTool,
            renderSpendingChartTool,
            renderRecentTransactionsTool,
            renderBudgetOverviewTool,
            renderCategoryBreakdownTool,
            renderMonthlyProjectionTool,
            renderPeopleBreakdownTool,
            renderIncomeOverviewTool,
            renderRecurringExpensesTool,
            renderSavingsOverviewTool,
          ],
        },
      ],
    };

    console.log('--- FULL CONFIG (TOOLS) ---');
    console.log(JSON.stringify(config, null, 2));
    console.log('---------------------------');

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config,
    });

    console.log('--- RAW AI RESPONSE ---');
    console.log(JSON.stringify(response, null, 2));
    if (response.usageMetadata) {
      console.log('--- TOKEN USAGE ---');
      console.log('Prompt Tokens:', response.usageMetadata.promptTokenCount);
      console.log('Candidates Tokens:', response.usageMetadata.candidatesTokenCount);
      console.log('Total Tokens:', response.usageMetadata.totalTokenCount);
      console.log('-------------------');
    }
    console.log('-----------------------');

    const text = response.text || '';

    // --- OPTIMIZED TOOL EXECUTION ---

    const rawToolCalls = response.functionCalls || [];
    const actionCalls: ToolCall[] = [];
    const viewCalls: ToolCall[] = [];

    // 1. Split Calls
    rawToolCalls.forEach(call => {
      if (!call.name) return; // Skip if no name

      if (call.name === 'addTransaction') {
        actionCalls.push({ name: call.name, args: call.args as Record<string, unknown> });
      } else {
        viewCalls.push({ name: call.name, args: call.args as Record<string, unknown> });
      }
    });

    // 2. Execute Actions First (Updates DB)
    const { toolCalls: executedActionCalls, createdTransactions } = await executeToolCalls(actionCalls, req.user._id.toString(), clientTimestamp);

    // 3. Lazy Load View Data (Using Fresh DB State)
    const finalViewCalls: ToolCall[] = [];

    // Re-fetch totals if actions occurred to ensure accuracy
    let freshTotalSpent = totalSpentReal;
    let freshTotalIncome = totalIncomeReal;

    if (createdTransactions.length > 0) {
      const freshMonthlyStats = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: startOfCurrentMonth },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]);
      freshTotalSpent = freshMonthlyStats.find((s) => s._id === TransactionType.EXPENSE)?.total || 0;
      freshTotalIncome = freshMonthlyStats.find((s) => s._id === TransactionType.INCOME)?.total || 0;
    }

    // Snapshot Recent Transactions (Check both View and Action calls)
    let recentTransactionsData: any[] = [];
    const needsRecentTransactions = viewCalls.some(c => c.name === 'renderRecentTransactions') ||
      executedActionCalls.some(c => c.name === 'renderRecentTransactions') ||
      createdTransactions.length > 0; // Force if we added a transaction

    if (needsRecentTransactions) {
      const recent = await Transaction.find({ user: req.user._id })
        .sort({ date: -1 })
        .limit(4);

      recentTransactionsData = recent.map(t => ({
        description: t.description,
        amount: t.amount,
        date: t.date,
        category: t.category,
        type: t.type
      }));
    }

    if (viewCalls.length > 0) {
      // Check what data we need
      const needsCategory = viewCalls.some(c => c.name === 'renderCategoryBreakdown');
      const needsIncome = viewCalls.some(c => c.name === 'renderIncomeOverview');
      const needsTrend = viewCalls.some(c => c.name === 'renderSpendingChart');
      const needsPeople = viewCalls.some(c => c.name === 'renderPeopleBreakdown');

      // Lazy Calculations
      let categoryData: any[] = [];
      if (needsCategory) {
        const categoryStats = await Transaction.aggregate([
          { $match: { user: req.user._id, type: TransactionType.EXPENSE, date: { $gte: startOfCurrentMonth } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
          { $sort: { total: -1 } }
        ]);
        categoryData = categoryStats.map(s => ({ name: s._id, value: s.total }));
      }

      let incomeData: any[] = [];
      if (needsIncome) {
        const incomeStats = await Transaction.aggregate([
          { $match: { user: req.user._id, type: TransactionType.INCOME, date: { $gte: startOfCurrentMonth } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
          { $sort: { total: -1 } }
        ]);
        incomeData = incomeStats.map(s => ({ name: s._id, value: s.total }));
      }

      let trendData: any[] = [];
      if (needsTrend) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const timezone = req.body.timezone || 'UTC';

        const dailyTrendStats = await Transaction.aggregate([
          { $match: { user: req.user._id, type: TransactionType.EXPENSE, date: { $gte: sevenDaysAgo } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: timezone } }, total: { $sum: '$amount' } } },
          { $sort: { _id: 1 } }
        ]);

        trendData = dailyTrendStats.map(stat => {
          const d = new Date(stat._id);
          return {
            name: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
            amount: stat.total,
            fullDesc: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          };
        });
      }

      let peopleData: any[] = [];
      if (needsPeople) {
        // Re-fetch people map if needed, or just use the one from context if no new people-related transactions
        // For simplicity and accuracy, let's re-aggregate if requested
        const peopleStats = await Transaction.aggregate([
          { $match: { user: req.user._id, date: { $gte: startOfCurrentMonth }, relatedPerson: { $exists: true, $ne: null } } },
          { $group: { _id: '$relatedPerson', total: { $sum: '$amount' } } },
          { $sort: { total: -1 } }
        ]);
        peopleData = peopleStats.map(s => ({ name: s._id || 'Unknown', value: s.total }));
      }

      let recurringData: any[] = [];
      if (viewCalls.some(c => c.name === 'renderRecurringExpenses')) {
        const recurring = await RecurringTransaction.find({ user: req.user._id, isActive: true })
          .sort({ amount: -1 });

        recurringData = recurring.map(t => ({
          description: t.description,
          amount: t.amount,
          dayOfMonth: t.dayOfMonth,
          category: t.category
        }));
      }

      let savingsData: any = {};
      if (viewCalls.some(c => c.name === 'renderSavingsOverview')) {
        const goals = await SavingsGoal.find({ userId: req.user._id });
        const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
        const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

        // Sort by progress % descending
        const topGoals = goals
          .map(g => ({
            name: g.name,
            current: g.currentAmount,
            target: g.targetAmount,
            progress: Math.min((g.currentAmount / g.targetAmount) * 100, 100),
            color: g.color,
            icon: g.icon
          }))
          .sort((a, b) => b.progress - a.progress)
          .slice(0, 3);

        savingsData = {
          totalSaved,
          totalTarget,
          overallProgress: totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0,
          topGoals
        };
      }

      // Populate View Calls
      for (const call of viewCalls) {
        const args = call.args || {};

        if (call.name === 'renderBudgetOverview') {
          args.totalSpent = freshTotalSpent;
          args.totalIncome = freshTotalIncome;
          args.budget = req.user?.budget || 0;
        } else if (call.name === 'renderCategoryBreakdown') {
          args.categories = categoryData;
        } else if (call.name === 'renderPeopleBreakdown') {
          args.people = peopleData;
        } else if (call.name === 'renderMonthlyProjection') {
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          const dayOfMonth = today.getDate();
          const dailyAverage = freshTotalSpent / Math.max(1, dayOfMonth);
          const projected = dailyAverage * daysInMonth;

          args.spent = freshTotalSpent;
          args.budget = req.user?.budget || 0;
          args.projected = projected;
          args.dailyAverage = dailyAverage;
          args.daysInMonth = daysInMonth;
          args.dayOfMonth = dayOfMonth;
        } else if (call.name === 'renderIncomeOverview') {
          args.incomeSources = incomeData;
          args.totalIncome = freshTotalIncome;
        } else if (call.name === 'renderSpendingChart') {
          args.trend = trendData;
        } else if (call.name === 'renderRecentTransactions') {
          args.recentTransactions = recentTransactionsData;
        } else if (call.name === 'renderRecurringExpenses') {
          args.recurringExpenses = recurringData;
        } else if (call.name === 'renderSavingsOverview') {
          args.savings = savingsData;
        }

        finalViewCalls.push({ name: call.name, args });
      }
    }

    // Inject Snapshot into Executed Action Calls (Implicit Views)
    // We use map to ensure we create new objects with the injected data
    const finalActionCalls = executedActionCalls.map(call => {
      if (call.name === 'renderRecentTransactions') {
        return {
          ...call,
          args: {
            ...call.args,
            recentTransactions: recentTransactionsData
          }
        };
      }
      return call;
    });

    // Safety: If we created transactions but somehow renderRecentTransactions is missing, add it
    if (createdTransactions.length > 0 && !finalActionCalls.some(c => c.name === 'renderRecentTransactions')) {
      finalActionCalls.push({
        name: 'renderRecentTransactions',
        args: { recentTransactions: recentTransactionsData }
      });
    }

    const finalToolCalls = [...finalActionCalls, ...finalViewCalls];

    // --- PERSISTENCE START ---
    const aiMessage = await ChatMessage.create({
      thread: currentThreadId,
      role: 'model',
      text: text,
      toolCalls: finalToolCalls.length ? finalToolCalls : [],
    });
    // --- PERSISTENCE END ---

    return res.json({
      text,
      toolCalls: finalToolCalls.length ? finalToolCalls : undefined,
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
      threadId: currentThreadId,
      messageId: aiMessage._id,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ message: 'Ma3lesh, I had trouble connecting to Hasala AI.' });
  }
};

// --- NEW HANDLERS ---

export const getThreads = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const threads = await ChatThread.find({ user: req.user._id })
      .sort({ lastMessageAt: -1 })
      .limit(50);

    return res.json(threads);
  } catch (error) {
    console.error('Get Threads Error:', error);
    return res.status(500).json({ message: 'Failed to fetch chat history.' });
  }
};

export const getThreadMessages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const { threadId } = req.params;

    const thread = await ChatThread.findOne({ _id: threadId, user: req.user._id });
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });

    const messages = await ChatMessage.find({ thread: threadId }).sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error('Get Messages Error:', error);
    return res.status(500).json({ message: 'Failed to fetch messages.' });
  }
};

export const deleteThread = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: 'Unauthorized' });
    const { threadId } = req.params;

    const thread = await ChatThread.findOneAndDelete({ _id: threadId, user: req.user._id });
    if (!thread) return res.status(404).json({ message: 'Thread not found.' });

    await ChatMessage.deleteMany({ thread: threadId });

    return res.json({ message: 'Thread deleted.' });
  } catch (error) {
    console.error('Delete Thread Error:', error);
    return res.status(500).json({ message: 'Failed to delete thread.' });
  }
};

