import { Request, Response } from 'express';
import Transaction, { ITransaction } from '../models/Transaction';
import { IUser } from '../models/User';
// Amounts are now stored directly as decimals (e.g., 50.00) - no conversion needed

// Interface to extend Request with User
interface AuthRequest extends Request {
  user?: IUser;
}

import { checkAndInjectRecurring } from './recurringController';

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    // Lazy Injection: Check for missed recurring expenses before fetching
    if (req.user?._id) {
      await checkAndInjectRecurring(req.user._id.toString());
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const month = parseInt(req.query.month as string); // 0-11
    const year = parseInt(req.query.year as string);

    const query: any = { user: req.user?._id };

    if (!isNaN(month) && !isNaN(year)) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
export const addTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, description, category, type, date, isRecurring, relatedPerson } = req.body;

    const transaction = await Transaction.create({
      user: req.user?._id,
      amount, // Store directly as decimal
      description,
      category,
      type,
      date: date || Date.now(),
      isRecurring: isRecurring || false,
      relatedPerson,
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

// @desc    Get transaction analytics
// @route   GET /api/transactions/analytics
// @access  Private
export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { period = '30', month, year } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    if (month !== undefined && year !== undefined) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      startDate = new Date(y, m, 1);
      endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else {
      startDate.setDate(startDate.getDate() - parseInt(period as string));
    }

    const dateFilter = { $gte: startDate, $lte: endDate };

    // 1. Total Spent vs Income
    const totals = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    // 2. Category Breakdown
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'EXPENSE',
          date: dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 3. Daily Trend
    const dailyTrend = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'EXPENSE',
          date: dateFilter
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. People Breakdown
    const peopleBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'EXPENSE',
          date: dateFilter,
          relatedPerson: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$relatedPerson',
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // 5. Income Breakdown
    const incomeBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'INCOME',
          date: dateFilter
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      totals,
      categoryBreakdown,
      dailyTrend,
      peopleBreakdown,
      incomeBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
