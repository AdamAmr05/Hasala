import { Request, Response } from 'express';
import SavingsGoal from '../models/SavingsGoal';

export const getGoals = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user._id;
        const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching savings goals' });
    }
};

export const createGoal = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user._id;
        const { name, targetAmount, color, icon, deadline } = req.body;

        const newGoal = new SavingsGoal({
            userId,
            name,
            targetAmount,
            color,
            icon,
            deadline
        });

        const savedGoal = await newGoal.save();
        res.status(201).json(savedGoal);
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ message: 'Error creating savings goal' });
    }
};

export const updateGoal = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user._id;
        const { id } = req.params;
        const updates = req.body;

        const goal = await SavingsGoal.findOneAndUpdate(
            { _id: id, userId },
            { $set: updates },
            { new: true }
        );

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: 'Error updating savings goal' });
    }
};

export const deleteGoal = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user._id;
        const { id } = req.params;

        const goal = await SavingsGoal.findOneAndDelete({ _id: id, userId });

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting savings goal' });
    }
};
