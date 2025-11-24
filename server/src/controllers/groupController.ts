import { Request, Response } from 'express';
import crypto from 'crypto';
import SplitGroup from '../models/SplitGroup';
import GroupExpense from '../models/GroupExpense';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';
// Amounts are now stored directly as decimals - no conversion needed

// Create a new group
export const createGroup = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const { name, currency = 'EGP' } = req.body;

        // Generate unique invite code using cryptographically secure random bytes
        let inviteCode = '';
        let isUnique = false;
        while (!isUnique) {
            inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 character hex string
            const existing = await SplitGroup.findOne({ inviteCode });
            if (!existing) isUnique = true;
        }

        const group = await SplitGroup.create({
            name,
            currency,
            inviteCode,
            createdBy: req.user._id,
            members: [{ user: req.user._id, joinedAt: new Date() }]
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

// Get user's groups
export const getUserGroups = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const groups = await SplitGroup.find({
            'members.user': req.user._id
        }).populate('members.user', 'name email avatar');

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Get group details and calculate balances
export const getGroupDetails = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const { id } = req.params;
        const group = await SplitGroup.findById(id).populate('members.user', 'name email avatar');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check membership
        const isMember = group.members.some((m: any) => m.user._id.toString() === (req.user as any)._id.toString());
        if (!isMember) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const expenses = await GroupExpense.find({ groupId: id })
            .populate('payer', 'name')
            .sort({ date: -1 });



        // Calculate balances (using decimals)
        const balances: { [key: string]: number } = {};
        group.members.forEach((m: any) => balances[m.user._id.toString()] = 0);

        expenses.forEach((exp: any) => {
            const payerId = exp.payer._id.toString();
            const amount = exp.amount; // Stored as decimal

            // Payer gets positive balance (owed money)
            balances[payerId] = (balances[payerId] || 0) + amount;

            // Splitters get negative balance (owe money)
            exp.splitDetails.forEach((split: any) => {
                const userId = split.user.toString();
                balances[userId] = (balances[userId] || 0) - split.amount;
            });
        });

        // Calculate simplified debts
        const debts = simplifyDebts(balances);

        // Only return top 10 expenses for initial view
        const recentExpenses = expenses.slice(0, 10);

        res.json({ group, expenses: recentExpenses, balances, debts });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Get paginated expenses
export const getGroupExpenses = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const { id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const group = await SplitGroup.findById(id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some((m: any) => m.user.toString() === (req.user as any)._id.toString());
        if (!isMember) return res.status(403).json({ message: 'Forbidden' });

        const expenses = await GroupExpense.find({ groupId: id })
            .populate('payer', 'name')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// Add expense
export const addExpense = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const { id } = req.params;
        const { description, amount, payer, splitDetails, isSettlement, date } = req.body;

        // Validation
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }
        if (!description || typeof description !== 'string') {
            return res.status(400).json({ message: 'Invalid description' });
        }
        if (!Array.isArray(splitDetails) || splitDetails.length === 0) {
            return res.status(400).json({ message: 'Invalid split details' });
        }

        // Check group existence and membership
        const group = await SplitGroup.findById(id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some((m: any) => m.user.toString() === (req.user as any)._id.toString());
        if (!isMember) return res.status(403).json({ message: 'Forbidden' });

        // Validate split details
        const memberIds = new Set(group.members.map((m: any) => m.user.toString()));
        let totalSplit = 0;

        for (const split of splitDetails) {
            if (!split.user || typeof split.amount !== 'number' || split.amount < 0) {
                return res.status(400).json({ message: 'Invalid split entry' });
            }
            if (!memberIds.has(split.user)) {
                return res.status(400).json({ message: `User ${split.user} is not a member of this group` });
            }
            totalSplit += split.amount;
        }

        // Validate total (allow small floating point tolerance)
        const diff = Math.abs(totalSplit - amount);
        if (diff > 0.01) {
            return res.status(400).json({
                message: `Split amounts sum to ${totalSplit.toFixed(2)}, but total is ${amount.toFixed(2)}. Difference: ${diff.toFixed(2)}`
            });
        }

        const expense = await GroupExpense.create({
            groupId: id,
            payer: payer || req.user._id,
            amount, // Store directly as decimal
            description,
            date: date || new Date(),
            splitDetails, // Store directly as decimal
            isSettlement: isSettlement || false
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

// Join group
export const joinGroup = async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const { inviteCode } = req.body;

        if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
            return res.status(400).json({ message: 'Invalid invite code' });
        }

        const group = await SplitGroup.findOne({ inviteCode: inviteCode.trim().toUpperCase() });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if already member
        const isMember = group.members.some((m: any) => m.user.toString() === (req.user as any)._id.toString());
        if (isMember) {
            return res.status(400).json({ message: 'Already a member' });
        }

        group.members.push({ user: req.user._id as any, joinedAt: new Date() });
        await group.save();

        res.json(group);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

// Helper: Simplify Debts (Greedy Algorithm)
const simplifyDebts = (balances: { [key: string]: number }) => {
    const debtors: { user: string, amount: number }[] = [];
    const creditors: { user: string, amount: number }[] = [];

    Object.entries(balances).forEach(([user, amount]) => {
        if (amount < 0) debtors.push({ user, amount: -amount }); // Store positive debt
        if (amount > 0) creditors.push({ user, amount });
    });

    // Sort by amount descending to minimize transactions
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debts: { from: string, to: string, amount: number }[] = [];
    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // Match amounts
        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0) {
            debts.push({ from: debtor.user, to: creditor.user, amount });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        // Check for near-zero (floating point tolerance)
        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return debts;
};
