import { Request, Response } from 'express';
import mongoose from 'mongoose';
import SplitGroup from '../models/SplitGroup';
import GroupExpense from '../models/GroupExpense';
import { IUser } from '../models/User';
import crypto from 'crypto';

interface AuthRequest extends Request {
    user?: IUser;
}

// @desc    Create a new split group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { name, currency } = req.body;

        if (!name) {
            res.status(400).json({ message: 'Please provide a group name' });
            return;
        }

        const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

        const group = await SplitGroup.create({
            name,
            currency: currency || 'SAR',
            members: [{
                user: req.user?._id,
                joinedAt: new Date()
            }],
            inviteCode,
            createdBy: req.user?._id
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req: AuthRequest, res: Response) => {
    try {
        const groups = await SplitGroup.find({
            'members.user': req.user?._id
        }).populate('members.user', 'name email avatar');

        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Get group details (expenses + balances)
// @route   GET /api/groups/:id
// @access  Private
export const getGroupDetails = async (req: AuthRequest, res: Response) => {
    try {
        const groupId = req.params.id;
        const group = await SplitGroup.findById(groupId)
            .populate('members.user', 'name email avatar');

        if (!group) {
            res.status(404).json({ message: 'Group not found' });
            return;
        }

        // Check membership
        const isMember = group.members.some(
            m => (m.user as any)._id.toString() === req.user?._id.toString()
        );

        if (!isMember) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const expenses = await GroupExpense.find({ groupId })
            .populate('payer', 'name')
            .populate('splitDetails.user', 'name')
            .sort({ date: -1 });

        // Calculate Balances
        const balances: { [key: string]: number } = {};

        // Init balances
        group.members.forEach(m => {
            balances[(m.user as any)._id.toString()] = 0;
        });

        expenses.forEach(exp => {
            const payerId = (exp.payer as any)._id.toString();

            if (exp.isSettlement) {
                // Settlement: Payer gave money to Receiver.
                // Receiver is the first person in splitDetails.
                // Payer's balance increases (they are owed more/owe less)
                // Receiver's balance decreases (they are owed less/owe more)
                if (exp.splitDetails.length > 0) {
                    const receiverId = (exp.splitDetails[0].user as any)._id.toString();
                    balances[payerId] = (balances[payerId] || 0) + exp.amount;
                    balances[receiverId] = (balances[receiverId] || 0) - exp.amount;
                }
            } else {
                // Expense: Payer paid full amount.
                balances[payerId] = (balances[payerId] || 0) + exp.amount;

                // Subtract split amounts
                exp.splitDetails.forEach(split => {
                    const debtorId = (split.user as any)._id.toString();
                    balances[debtorId] = (balances[debtorId] || 0) - split.amount;
                });
            }
        });

        // Simplify Debts Logic
        const debts = [];
        const debtors = [];
        const creditors = [];

        for (const [userId, amount] of Object.entries(balances)) {
            const rounded = Math.round(amount * 100) / 100;
            if (rounded < -0.01) debtors.push({ userId, amount: rounded });
            if (rounded > 0.01) creditors.push({ userId, amount: rounded });
        }

        debtors.sort((a, b) => a.amount - b.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        let i = 0;
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];
            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);
            const roundedAmount = Math.round(amount * 100) / 100;

            if (roundedAmount > 0) {
                debts.push({
                    from: debtor.userId,
                    to: creditor.userId,
                    amount: roundedAmount
                });
            }

            debtor.amount += amount;
            creditor.amount -= amount;

            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        res.status(200).json({
            group,
            expenses,
            balances,
            debts
        });

    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Add expense to group
// @route   POST /api/groups/:id/expenses
// @access  Private
export const addExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, description, splitDetails, isSettlement } = req.body;
        const groupId = req.params.id;

        // Validate split total matches amount (unless settlement)
        if (!isSettlement) {
            const totalSplit = splitDetails.reduce((acc: number, curr: any) => acc + curr.amount, 0);
            if (Math.abs(totalSplit - amount) > 0.05) { // Allow small float error
                res.status(400).json({ message: `Split amounts (${totalSplit}) do not match total (${amount})` });
                return;
            }
        }

        const expense = await GroupExpense.create({
            groupId,
            payer: req.user?._id,
            amount,
            description,
            splitDetails,
            isSettlement: isSettlement || false,
            date: new Date()
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// @desc    Join group via code
// @route   POST /api/groups/join
// @access  Private
export const joinGroup = async (req: AuthRequest, res: Response) => {
    try {
        const { inviteCode } = req.body;
        const group = await SplitGroup.findOne({ inviteCode });

        if (!group) {
            res.status(404).json({ message: 'Invalid code' });
            return;
        }

        const isMember = group.members.some(m => m.user.toString() === req.user?._id.toString());
        if (isMember) {
            res.status(400).json({ message: 'Already a member' });
            return;
        }

        if (!req.user?._id) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        group.members.push({
            user: (req.user as any)._id,
            joinedAt: new Date()
        });

        await group.save();
        res.status(200).json(group);

    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
