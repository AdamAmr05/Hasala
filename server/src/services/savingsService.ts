import mongoose from 'mongoose';
import SavingsGoal, { ISavingsGoal } from '../models/SavingsGoal';

interface CreateGoalData {
    userId: string;
    name: string;
    targetAmount: number;
    color: string;
    icon: string;
    deadline?: Date;
}

interface UpdateGoalData {
    name?: string;
    targetAmount?: number;
    color?: string;
    icon?: string;
    deadline?: Date;
    currentAmount?: number;
    delta?: number;
}

export const SavingsService = {
    /**
     * Get all savings goals for a user
     */
    getGoals: async (userId: string): Promise<ISavingsGoal[]> => {
        return await SavingsGoal.find({ userId }).sort({ createdAt: -1 });
    },

    /**
     * Create a new savings goal
     */
    createGoal: async (data: CreateGoalData): Promise<ISavingsGoal> => {
        const newGoal = new SavingsGoal({
            userId: data.userId,
            name: data.name,
            targetAmount: Math.round(data.targetAmount * 100) / 100,
            color: data.color,
            icon: data.icon,
            deadline: data.deadline
        });
        return await newGoal.save();
    },

    /**
     * Update a savings goal
     */
    updateGoal: async (id: string, userId: string, data: UpdateGoalData): Promise<ISavingsGoal | null> => {
        const { delta, ...updates } = data;
        let updateOp: any = {};

        // Atomic update for amount changes
        if (delta !== undefined) {
            updateOp.$inc = { currentAmount: delta };
            // If delta is present, we ignore direct currentAmount updates to prevent conflicts
            // and ensure atomicity.
            if (updates.currentAmount !== undefined) {
                delete updates.currentAmount;
            }
        }

        // Standard updates
        if (Object.keys(updates).length > 0) {
            updateOp.$set = updates;

            // Round amounts if they are being set directly
            if (updates.targetAmount !== undefined) {
                updateOp.$set.targetAmount = Math.round(updates.targetAmount * 100) / 100;
            }
            if (updates.currentAmount !== undefined) {
                updateOp.$set.currentAmount = Math.round(updates.currentAmount * 100) / 100;
            }
        }

        return await SavingsGoal.findOneAndUpdate(
            { _id: id, userId },
            updateOp,
            { new: true }
        );
    },

    /**
     * Delete a savings goal
     */
    deleteGoal: async (id: string, userId: string): Promise<ISavingsGoal | null> => {
        return await SavingsGoal.findOneAndDelete({ _id: id, userId });
    }
};
