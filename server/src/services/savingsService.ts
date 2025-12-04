import mongoose from 'mongoose';
import SavingsGoal, { ISavingsGoal } from '../models/SavingsGoal';
import Decimal from 'decimal.js';

interface CreateGoalData {
    userId: string;
    name: string;
    targetAmount: number;
    color: string;
    icon: string;
    stepAmount?: number;
    deadline?: Date;
}

interface UpdateGoalData {
    name?: string;
    targetAmount?: number;
    color?: string;
    icon?: string;
    stepAmount?: number;
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
     * Get a single savings goal
     */
    getGoalById: async (id: string, userId: string): Promise<ISavingsGoal | null> => {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await SavingsGoal.findOne({ _id: id, userId });
    },

    /**
     * Create a new savings goal
     */
    createGoal: async (data: CreateGoalData): Promise<ISavingsGoal> => {
        const newGoal = new SavingsGoal({
            userId: data.userId,
            name: data.name,
            // Use Decimal for precise rounding to 2 decimal places
            targetAmount: new Decimal(data.targetAmount).toDecimalPlaces(2).toNumber(),
            color: data.color,
            icon: data.icon,
            stepAmount: data.stepAmount,
            deadline: data.deadline
        });
        return await newGoal.save();
    },

    /**
     * Update a savings goal
     */
    updateGoal: async (id: string, userId: string, data: UpdateGoalData): Promise<ISavingsGoal | null> => {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;

        const { delta, ...updates } = data;
        let updateOp: any = {};

        // Atomic update for amount changes with validation
        if (delta !== undefined) {
            // 1. Fetch current state to ensure non-negative result
            const currentGoal = await SavingsGoal.findOne({ _id: id, userId });
            if (!currentGoal) return null;

            const roundedDelta = new Decimal(delta).toDecimalPlaces(2).toNumber();
            const newAmount = new Decimal(currentGoal.currentAmount).plus(roundedDelta);

            // 2. Validate: Cannot go below zero
            if (newAmount.isNegative()) {
                throw new Error('Insufficient savings balance for this operation.');
            }

            updateOp.$inc = { currentAmount: roundedDelta };

            // If delta is present, we ignore direct currentAmount updates to prevent conflicts
            if (updates.currentAmount !== undefined) {
                delete updates.currentAmount;
            }
        }

        // Standard updates
        if (Object.keys(updates).length > 0) {
            updateOp.$set = updates;

            // Round amounts if they are being set directly
            if (updates.targetAmount !== undefined) {
                updateOp.$set.targetAmount = new Decimal(updates.targetAmount).toDecimalPlaces(2).toNumber();
            }
            if (updates.currentAmount !== undefined) {
                updateOp.$set.currentAmount = new Decimal(updates.currentAmount).toDecimalPlaces(2).toNumber();
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
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await SavingsGoal.findOneAndDelete({ _id: id, userId });
    }
};
