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
        let nextDueDate = new Date(expense.lastInjected);
        // Move to the next potential due date based on dayOfMonth
        // Logic: Start from lastInjected. If dayOfMonth is 5, and lastInjected was Oct 5, next is Nov 5.
        // If lastInjected was Oct 1 (creation), and day is 5, next is Oct 5.

        // Simple approach: iterate month by month from lastInjected until we reach now.

        // 1. Determine the first candidate date after lastInjected
        let candidateDate = new Date(expense.lastInjected);
        candidateDate.setDate(expense.dayOfMonth);

        // If the candidate date is before or same as lastInjected, move to next month
        if (candidateDate <= expense.lastInjected) {
            candidateDate.setMonth(candidateDate.getMonth() + 1);
        }

        // While the candidate date is in the past (before now)
        while (candidateDate <= now) {
            // Create the transaction
            const newTransaction = await Transaction.create({
                user: userId,
                amount: expense.amount,
                description: expense.description + ' (Auto)',
                category: expense.category,
                type: TransactionType.EXPENSE,
                date: candidateDate, // Backdated!
                isRecurring: true,
            });

            createdTransactions.push(newTransaction);

            // Update lastInjected to this date
            expense.lastInjected = candidateDate;
            await expense.save();

            // Move to next month
            candidateDate = new Date(candidateDate); // Clone to avoid reference issues
            candidateDate.setMonth(candidateDate.getMonth() + 1);
        }
    }

    return createdTransactions;
};

// @desc    DEV: Reset lastInjected to test injection
// @route   POST /api/recurring/:id/test-reset
// @access  Private
export const resetLastInjected = async (req: AuthRequest, res: Response) => {
    try {
        const expense = await RecurringExpense.findById(req.params.id);
        if (!expense) {
            res.status(404).json({ message: 'Not found' });
            return;
        }

        // Set to 2 months ago to ensure it triggers
        const pastDate = new Date();
        pastDate.setMonth(pastDate.getMonth() - 2);
        expense.lastInjected = pastDate;
        await expense.save();

        res.status(200).json({ message: 'Reset successful. Go to dashboard to trigger injection.' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
