import { Request, Response } from 'express';
import RecurringExpense from '../models/RecurringExpense';
import Transaction, { TransactionType } from '../models/Transaction';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
    user?: IUser;
}

// @desc    Get all recurring expenses
// @route   GET /api/recurring
// @access  Private
export const getRecurringExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const expenses = await RecurringExpense.find({ user: req.user?._id });
        res.status(200).json(expenses);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Add a new recurring expense
// @route   POST /api/recurring
// @access  Private
export const addRecurringExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, description, category, dayOfMonth } = req.body;

        const expense = await RecurringExpense.create({
            user: req.user?._id,
            amount,
            description,
            category,
            dayOfMonth,
            // Set lastInjected to a safe past date (e.g., beginning of this month) 
            // so it doesn't trigger immediately if today > dayOfMonth unless we want it to.
            // For now, let's set it to NOW so it only triggers next month, 
            // OR we can set it to null/past to trigger immediately if missed.
            // Let's default to NOW to avoid "double charging" if they just paid it manually.
            lastInjected: new Date(),
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

// @desc    Delete a recurring expense
// @route   DELETE /api/recurring/:id
// @access  Private
export const deleteRecurringExpense = async (req: AuthRequest, res: Response) => {
    try {
        const expense = await RecurringExpense.findById(req.params.id);

        if (!expense) {
            res.status(404).json({ message: 'Recurring expense not found' });
            return;
        }

        if (expense.user.toString() !== req.user?._id.toString()) {
            res.status(401).json({ message: 'User not authorized' });
            return;
        }

        await expense.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// --- LAZY INJECTION LOGIC ---

export const checkAndInjectRecurring = async (userId: string) => {
    const recurringExpenses = await RecurringExpense.find({ user: userId, isActive: true });
    const now = new Date();
    const createdTransactions = [];

    for (const expense of recurringExpenses) {
        // Start checking from the month AFTER the last injection
        let targetDate = new Date(expense.lastInjected);
        targetDate.setMonth(targetDate.getMonth() + 1);

        // Set the day, clamping to the last day of the month if needed
        // e.g. if dayOfMonth is 31, and target is Feb, set to Feb 28/29
        const daysInTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const actualDay = Math.min(expense.dayOfMonth, daysInTargetMonth);
        targetDate.setDate(actualDay);

        // While the target date is in the past (before or equal to now)
        while (targetDate <= now) {
            // Create the transaction
            const newTransaction = await Transaction.create({
                user: userId,
                amount: expense.amount,
                description: expense.description + ' (Auto)',
                category: expense.category,
                type: TransactionType.EXPENSE,
                date: targetDate, // Backdated!
                isRecurring: true,
            });

            createdTransactions.push(newTransaction);

            // Update lastInjected to this date
            expense.lastInjected = targetDate;
            await expense.save();

            // Move to next month
            targetDate = new Date(targetDate); // Clone
            targetDate.setMonth(targetDate.getMonth() + 1);

            // Re-clamp for the new month to prevent drift
            // (e.g. if we were at Feb 28, next month should be Mar 31, not Mar 28)
            const daysInNextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
            const nextActualDay = Math.min(expense.dayOfMonth, daysInNextMonth);
            targetDate.setDate(nextActualDay);
        }
    }

    return createdTransactions;
};
