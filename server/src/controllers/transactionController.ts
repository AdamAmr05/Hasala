import { Request, Response } from 'express';
import Transaction, { ITransaction } from '../models/Transaction';
import { IUser } from '../models/User';

// Interface to extend Request with User
interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    // Get transactions for the logged-in user, sorted by date (newest first)
    const transactions = await Transaction.find({ user: req.user?._id }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
export const addTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, category, type, date, isRecurring } = req.body;

    const transaction = await Transaction.create({
      user: req.user?._id,
      amount,
      description,
      category,
      type,
      date: date || Date.now(),
      isRecurring: isRecurring || false,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Ensure user owns the transaction
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

