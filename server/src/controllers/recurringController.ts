import { Request, Response } from 'express';
import RecurringTransaction from '../models/RecurringTransaction';
import Transaction, { TransactionType } from '../models/Transaction';
import { IUser } from '../models/User';
// Amounts are now stored directly as decimals - no conversion needed

interface AuthRequest extends Request {
    user?: IUser;
}

// @desc    Get all recurring transactions
// @route   GET /api/recurring
// @access  Private
export const getRecurringTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const transactions = await RecurringTransaction.find({ user: req.user?._id });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Add a new recurring transaction
// @route   POST /api/recurring
// @access  Private
export const addRecurringTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, description, category, type, dayOfMonth } = req.body;

        const transaction = await RecurringTransaction.create({
            user: req.user?._id,
            amount, // Store directly as decimal
            description,
            category,
            type: type || 'EXPENSE',
            dayOfMonth,
            // Set lastInjected to NOW to avoid immediate double charging
            lastInjected: new Date(),
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

// @desc    Delete a recurring transaction
// @route   DELETE /api/recurring/:id
// @access  Private
export const deleteRecurringTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await RecurringTransaction.findById(req.params.id);

        if (!transaction) {
            res.status(404).json({ message: 'Recurring transaction not found' });
            return;
        }

        if (transaction.user.toString() !== req.user?._id.toString()) {
            res.status(401).json({ message: 'User not authorized' });
            return;
        }

        await transaction.deleteOne();
        res.status(200).json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// --- LAZY INJECTION LOGIC ---

// @desc    Rewind a recurring transaction (FOR TESTING)
// @route   POST /api/recurring/:id/rewind
// @access  Private
export const rewindRecurringTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const transaction = await RecurringTransaction.findById(req.params.id);

        if (!transaction) {
            res.status(404).json({ message: 'Recurring transaction not found' });
            return;
        }

        // Rewind lastInjected by 1 month + 1 day to ensure it triggers
        const newDate = new Date(transaction.lastInjected);
        newDate.setMonth(newDate.getMonth() - 1);
        newDate.setDate(newDate.getDate() - 1);

        transaction.lastInjected = newDate;
        await transaction.save();

        res.status(200).json({ message: 'Rewound successfully', newDate });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const checkAndInjectRecurring = async (userId: string) => {
    const recurringTransactions = await RecurringTransaction.find({ user: userId, isActive: true });
    const now = new Date();
    const createdTransactions = [];

    for (const recurring of recurringTransactions) {
        // Store the original lastInjected for atomic comparison
        let currentLastInjected = new Date(recurring.lastInjected);
        
        // Start checking from the month AFTER the last injection
        let targetDate = new Date(currentLastInjected);
        targetDate.setMonth(targetDate.getMonth() + 1);

        // Set the day, clamping to the last day of the month if needed
        const daysInTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const actualDay = Math.min(recurring.dayOfMonth, daysInTargetMonth);
        targetDate.setDate(actualDay);

        // While the target date is in the past (before or equal to now)
        while (targetDate <= now) {
            // ATOMIC UPDATE: Only succeeds if lastInjected hasn't changed
            // This prevents race conditions where two requests try to inject the same month
            const updated = await RecurringTransaction.findOneAndUpdate(
                { 
                    _id: recurring._id,
                    lastInjected: currentLastInjected // Only update if unchanged
                },
                { $set: { lastInjected: targetDate } },
                { new: true }
            );

            if (!updated) {
                // Another request already processed this - skip to avoid duplicates
                break;
            }

            // Successfully claimed this injection - now create the transaction
            const newTransaction = await Transaction.create({
                user: userId,
                amount: recurring.amount,
                description: recurring.description + ' (Auto)',
                category: recurring.category,
                type: recurring.type,
                date: targetDate, // Backdated!
                isRecurring: true,
            });

            createdTransactions.push(newTransaction);

            // Update our reference for the next iteration
            currentLastInjected = targetDate;

            // Move to next month
            targetDate = new Date(targetDate); // Clone
            targetDate.setMonth(targetDate.getMonth() + 1);

            // Re-clamp for the new month to prevent drift
            const daysInNextMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
            const nextActualDay = Math.min(recurring.dayOfMonth, daysInNextMonth);
            targetDate.setDate(nextActualDay);
        }
    }

    return createdTransactions;
};
