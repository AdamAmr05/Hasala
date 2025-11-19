import mongoose, { Document, Schema } from 'mongoose';
import { Category } from './Transaction';

export interface IBudget extends Document {
    user: mongoose.Schema.Types.ObjectId;
    category: Category;
    amount: number;
    period: 'MONTHLY' | 'WEEKLY';
}

const BudgetSchema: Schema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    category: {
        type: String,
        enum: Object.values(Category),
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    period: {
        type: String,
        enum: ['MONTHLY', 'WEEKLY'],
        default: 'MONTHLY',
    },
}, {
    timestamps: true,
});

// Compound index to ensure unique budget per category per user
BudgetSchema.index({ user: 1, category: 1 }, { unique: true });

const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);

export default Budget;
