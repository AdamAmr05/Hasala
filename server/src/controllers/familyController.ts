import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import FamilyGroup, { IFamilyGroup } from '../models/FamilyGroup';
import Transaction, { TransactionType, Category } from '../models/Transaction';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

// ============================================================================
// Types
// ============================================================================

interface CategoryBreakdown {
    name: string;
    amount: number;
}

interface MemberSummary {
    user: {
        _id: string;
        name: string;
    };
    role: 'ADMIN' | 'MEMBER';
    joinedAt: Date;
    totalSpent: number;
    totalIncome: number;
    budget: number;
    budgetPercentUsed: number;
    topCategory: CategoryBreakdown | null;
    categoryBreakdown: CategoryBreakdown[];
    status: 'safe' | 'warning' | 'critical';
    insight: string;
}

interface FamilyDetailsResponse {
    family: IFamilyGroup;
    members: MemberSummary[];
}

// ============================================================================
// Helpers
// ============================================================================

const generateInviteCode = async (): Promise<string> => {
    let inviteCode = '';
    let isUnique = false;

    while (!isUnique) {
        // 6-character alphanumeric code (easier to type than 8-char hex)
        inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const existing = await FamilyGroup.findOne({ inviteCode });
        if (!existing) isUnique = true;
    }

    return inviteCode;
};

const getHealthStatus = (budgetPercent: number): 'safe' | 'warning' | 'critical' => {
    if (budgetPercent >= 100) return 'critical';
    if (budgetPercent >= 80) return 'warning';
    return 'safe';
};

const generateInsight = (
    name: string,
    topCategory: CategoryBreakdown | null,
    budgetPercent: number,
    status: 'safe' | 'warning' | 'critical',
    totalSpent: number,
    budget: number,
    totalIncome: number,
    categoryBreakdown: CategoryBreakdown[]
): string => {
    const remaining = budget > 0 ? budget - totalSpent : totalIncome - totalSpent;
    const remainingFormatted = Math.abs(remaining).toLocaleString();
    const topCategoryPercent = topCategory && totalSpent > 0
        ? Math.round((topCategory.amount / totalSpent) * 100)
        : 0;

    // Critical: Over budget
    if (status === 'critical') {
        const overBy = totalSpent - (budget || totalIncome);
        return `${name} is ${overBy.toLocaleString()} EGP over budget. Top spending: ${topCategory?.name || 'N/A'} (${topCategoryPercent}% of total).`;
    }

    // Warning: Approaching limit
    if (status === 'warning') {
        return `${name} has ${remainingFormatted} EGP left (${Math.round(100 - budgetPercent)}%). Biggest expense: ${topCategory?.name || 'N/A'} at ${topCategory?.amount.toLocaleString() || 0} EGP.`;
    }

    // Safe: Good standing
    if (topCategory && topCategory.amount > 0) {
        // Check if one category dominates (>40%)
        if (topCategoryPercent >= 40) {
            return `${name} has ${remainingFormatted} EGP remaining. ${topCategory.name} takes ${topCategoryPercent}% of spending (${topCategory.amount.toLocaleString()} EGP).`;
        }

        // Balanced spending
        const categoryCount = categoryBreakdown.filter(c => c.amount > 0).length;
        if (categoryCount >= 3) {
            return `${name} has ${remainingFormatted} EGP left. Spending is balanced across ${categoryCount} categories.`;
        }

        return `${name} has ${remainingFormatted} EGP remaining. Main expense: ${topCategory.name} (${topCategory.amount.toLocaleString()} EGP).`;
    }

    // No spending yet
    if (totalSpent === 0) {
        return `${name} has no spending recorded this month yet.`;
    }

    return `${name} has ${remainingFormatted} EGP remaining this month.`;
};

// ============================================================================
// Controllers
// ============================================================================

/**
 * Create a new family group
 * POST /api/family
 */
export const createFamily = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ message: 'Family name is required' });
        }

        const inviteCode = await generateInviteCode();

        const family = await FamilyGroup.create({
            name: name.trim(),
            inviteCode,
            members: [{
                user: req.user._id,
                role: 'ADMIN',
                joinedAt: new Date(),
            }],
        });

        return res.status(201).json(family);
    } catch (error) {
        console.error('Create family error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get user's family groups
 * GET /api/family
 */
export const getUserFamilies = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const families = await FamilyGroup.find({
            'members.user': req.user._id,
        }).populate('members.user', 'name email');

        return res.json(families);
    } catch (error) {
        console.error('Get families error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Join a family group via invite code
 * POST /api/family/join
 */
export const joinFamily = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { inviteCode } = req.body;

        if (!inviteCode || typeof inviteCode !== 'string' || !inviteCode.trim()) {
            return res.status(400).json({ message: 'Invite code is required' });
        }

        const family = await FamilyGroup.findOne({
            inviteCode: inviteCode.trim().toUpperCase(),
        });

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        // Check if already a member
        const isMember = family.members.some(
            (m) => m.user.toString() === req.user!._id.toString()
        );

        if (isMember) {
            return res.status(400).json({ message: 'Already a member of this family' });
        }

        family.members.push({
            user: req.user._id,
            role: 'MEMBER',
            joinedAt: new Date(),
        });

        await family.save();

        // Return populated family
        const populated = await FamilyGroup.findById(family._id)
            .populate('members.user', 'name email');

        return res.json(populated);
    } catch (error) {
        console.error('Join family error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Get family details with aggregated member summaries
 * GET /api/family/:id
 */
export const getFamilyDetails = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { id } = req.params;

        const family = await FamilyGroup.findById(id)
            .populate('members.user', 'name email budget');

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        // Verify membership
        const isMember = family.members.some(
            (m: any) => m.user._id.toString() === req.user!._id.toString()
        );

        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this family' });
        }

        // Get current month start
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Aggregate spending data for all members
        const memberSummaries: MemberSummary[] = [];

        for (const member of family.members) {
            const memberUser = member.user as unknown as IUser;
            const userId = memberUser._id;

            // Get monthly totals by type
            const monthlyStats = await Transaction.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId.toString()),
                        date: { $gte: startOfMonth },
                    },
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' },
                    },
                },
            ]);

            const totalSpent = monthlyStats.find((s) => s._id === TransactionType.EXPENSE)?.total || 0;
            const totalIncome = monthlyStats.find((s) => s._id === TransactionType.INCOME)?.total || 0;

            // Get category breakdown for expenses
            const categoryStats = await Transaction.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId.toString()),
                        type: TransactionType.EXPENSE,
                        date: { $gte: startOfMonth },
                    },
                },
                {
                    $group: {
                        _id: '$category',
                        total: { $sum: '$amount' },
                    },
                },
                { $sort: { total: -1 } },
            ]);

            const categoryBreakdown: CategoryBreakdown[] = categoryStats.map((c) => ({
                name: c._id as string,
                amount: c.total,
            }));

            const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

            // Calculate budget status
            const budget = memberUser.budget || totalIncome || 1; // Fallback to income or 1 to avoid division by zero
            const budgetPercentUsed = (totalSpent / budget) * 100;
            const status = getHealthStatus(budgetPercentUsed);
            const insight = generateInsight(memberUser.name, topCategory, budgetPercentUsed, status, totalSpent, budget, totalIncome, categoryBreakdown);

            memberSummaries.push({
                user: {
                    _id: userId.toString(),
                    name: memberUser.name,
                },
                role: member.role,
                joinedAt: member.joinedAt,
                totalSpent,
                totalIncome,
                budget: memberUser.budget || 0,
                budgetPercentUsed: Math.min(budgetPercentUsed, 100), // Cap at 100 for display
                topCategory,
                categoryBreakdown,
                status,
                insight,
            });
        }

        const response: FamilyDetailsResponse = {
            family,
            members: memberSummaries,
        };

        return res.json(response);
    } catch (error) {
        console.error('Get family details error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Leave a family group
 * POST /api/family/:id/leave
 */
export const leaveFamily = async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { id } = req.params;

        const family = await FamilyGroup.findById(id);

        if (!family) {
            return res.status(404).json({ message: 'Family not found' });
        }

        const memberIndex = family.members.findIndex(
            (m) => m.user.toString() === req.user!._id.toString()
        );

        if (memberIndex === -1) {
            return res.status(400).json({ message: 'Not a member of this family' });
        }

        // Check if user is the only ADMIN
        const isAdmin = family.members[memberIndex].role === 'ADMIN';
        const adminCount = family.members.filter((m) => m.role === 'ADMIN').length;

        if (isAdmin && adminCount === 1 && family.members.length > 1) {
            return res.status(400).json({
                message: 'Cannot leave: You are the only admin. Promote another member first.',
            });
        }

        // Remove member
        family.members.splice(memberIndex, 1);

        // If no members left, delete the family
        if (family.members.length === 0) {
            await FamilyGroup.findByIdAndDelete(id);
            return res.json({ message: 'Left family. Family was deleted as no members remain.' });
        }

        await family.save();
        return res.json({ message: 'Successfully left the family' });
    } catch (error) {
        console.error('Leave family error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
