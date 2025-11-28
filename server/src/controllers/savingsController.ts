import { Request, Response } from 'express';
import { SavingsService } from '../services/savingsService';
import { IUser } from '../models/User';

interface AuthRequest extends Request {
    user?: IUser;
}

export const getGoals = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }
        const goals = await SavingsService.getGoals(userId.toString());
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching savings goals' });
    }
};

export const createGoal = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const { name, targetAmount, color, icon, deadline } = req.body;

        // Validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ message: 'Valid name is required' });
        }
        if (targetAmount === undefined || typeof targetAmount !== 'number' || !Number.isFinite(targetAmount) || targetAmount < 0) {
            return res.status(400).json({ message: 'Valid target amount is required' });
        }

        const savedGoal = await SavingsService.createGoal({
            userId: userId.toString(),
            name: name.trim(),
            targetAmount,
            color,
            icon,
            deadline
        });

        res.status(201).json(savedGoal);
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ message: 'Error creating savings goal' });
    }
};

export const updateGoal = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const { id } = req.params;

        // Whitelist allowed fields to prevent mass assignment
        const { name, targetAmount, color, icon, delta, deadline } = req.body;
        const safeUpdates: any = {};

        if (name !== undefined) safeUpdates.name = name;
        if (targetAmount !== undefined) safeUpdates.targetAmount = targetAmount;
        if (color !== undefined) safeUpdates.color = color;
        if (icon !== undefined) safeUpdates.icon = icon;
        if (delta !== undefined) safeUpdates.delta = delta;
        if (deadline !== undefined) safeUpdates.deadline = deadline;

        const goal = await SavingsService.updateGoal(id, userId.toString(), safeUpdates);

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: 'Error updating savings goal' });
    }
};

export const deleteGoal = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        const { id } = req.params;

        const goal = await SavingsService.deleteGoal(id, userId.toString());

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting savings goal' });
    }
};
