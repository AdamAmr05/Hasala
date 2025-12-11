import Transaction, { ITransaction, TransactionType } from '../models/Transaction';
import RecurringTransaction from '../models/RecurringTransaction';
import SavingsGoal from '../models/SavingsGoal';
import { IUser } from '../models/User';

export interface FinancialContextData {
    budget: number;
    totalIncome: number;
    totalSpent: number;
    remainingOverBudget: number;
    remainingOverIncome: number;
    healthStatus: string;
    topCategoryName: string;
    topCategoryAmount: number;
    dailyAverage: number;
    projectedTotal: number;
    effectiveBudget: number;
    upcomingLiabilitiesText: string;
    savingsContext: string;
    peopleContext: string;
    userName: string;
    currency: string;
}

export const FinancialContextService = {
    buildFinancialContextData: async (user: IUser): Promise<FinancialContextData> => {
        // 1. Fetch Transactions (Context: Last 20, plus specific month data)
        const transactions = await Transaction.find({ user: user._id })
            .sort({ date: -1 })
            .limit(20);

        const startOfCurrentMonth = new Date();
        startOfCurrentMonth.setDate(1);
        startOfCurrentMonth.setHours(0, 0, 0, 0);

        // Monthly Stats Aggregation
        const monthlyStats = await Transaction.aggregate([
            {
                $match: {
                    user: user._id,
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

        // 2. People Context
        const monthlyPeopleTransactions = await Transaction.find({
            user: user._id,
            date: { $gte: startOfCurrentMonth },
            relatedPerson: { $exists: true, $ne: null },
        }).select('relatedPerson amount');

        const peopleMap = monthlyPeopleTransactions.reduce((acc, t) => {
            if (t.relatedPerson) {
                acc[t.relatedPerson] = (acc[t.relatedPerson] || 0) + t.amount;
            }
            return acc;
        }, {} as Record<string, number>);

        const peopleStats = Object.entries(peopleMap)
            .map(([name, total]) => `${name}: ${total} EGP`)
            .join(', ');

        // 3. Recurring Expenses Context
        const recurringTransactions = await RecurringTransaction.find({ user: user._id, isActive: true });
        const today = new Date();

        const upcomingBills = recurringTransactions.filter(transaction => {
            return transaction.dayOfMonth >= today.getDate() && transaction.type === 'EXPENSE';
        });

        const upcomingLiabilitiesTotal = upcomingBills.reduce((sum, exp) => sum + exp.amount, 0);
        const upcomingLiabilitiesText = upcomingBills.length > 0
            ? `${upcomingLiabilitiesTotal.toLocaleString()} EGP (${upcomingBills.map(b => `${b.description}: ${b.amount}`).join(', ')})`
            : '';

        // 4. Savings Context
        const savingsGoals = await SavingsGoal.find({ userId: user._id });
        const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
        const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

        const getProgress = (current: number, target: number) => target > 0 ? current / target : 0;

        const topGoals = savingsGoals
            .sort((a, b) => getProgress(b.currentAmount, b.targetAmount) - getProgress(a.currentAmount, a.targetAmount))
            .slice(0, 3)
            .map(g => `${g.name}: ${g.currentAmount}/${g.targetAmount} (${Math.round(getProgress(g.currentAmount, g.targetAmount) * 100)}%)`)
            .join(', ');

        const savingsContext = savingsGoals.length > 0
            ? `Total Saved: ${totalSaved.toLocaleString()} / ${totalTarget.toLocaleString()} EGP. Top Goals: ${topGoals}.`
            : 'No active savings goals.';

        // 5. Derived Metrics
        const budget = user.budget || 0;
        const effectiveBudget = budget > 0 ? budget : totalIncomeReal;
        const remainingOverBudget = effectiveBudget - totalSpentReal;
        const remainingOverIncome = totalIncomeReal - totalSpentReal;

        // Health Status
        let healthStatus = 'Healthy';
        if (remainingOverBudget < 0) healthStatus = 'Critical (Over Budget Goal)';
        else if (remainingOverBudget < effectiveBudget * 0.2) healthStatus = 'Low (Caution)';

        // Top Category (This Month)
        // NOTE: Previously this was derived from the last 20 transactions, which can drift away
        // from the monthly totals above. We compute it from the current month's expenses to keep
        // the injected AI context consistent and trustworthy.
        const monthlyTopCategory = await Transaction.aggregate([
            {
                $match: {
                    user: user._id,
                    type: TransactionType.EXPENSE,
                    date: { $gte: startOfCurrentMonth },
                },
            },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                },
            },
            { $sort: { total: -1 } },
            { $limit: 1 },
        ]);

        const topCategoryName = monthlyTopCategory[0]?._id || 'None';
        const topCategoryAmount = monthlyTopCategory[0]?.total || 0;

        // Projections
        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dailyAverage = totalSpentReal / Math.max(1, dayOfMonth);
        const projectedTotal = dailyAverage * daysInMonth;

        const peopleContext = peopleStats
            ? `People tracked this month: ${peopleStats}.`
            : 'No people tracked yet this month.';

        return {
            budget,
            totalIncome: totalIncomeReal,
            totalSpent: totalSpentReal,
            remainingOverBudget,
            remainingOverIncome,
            healthStatus,
            topCategoryName,
            topCategoryAmount,
            dailyAverage,
            projectedTotal,
            effectiveBudget,
            upcomingLiabilitiesText,
            savingsContext,
            peopleContext,
            userName: user.name || 'friend',
            currency: 'EGP'
        };
    }
};
