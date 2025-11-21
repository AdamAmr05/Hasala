import mongoose, { Document, Schema } from 'mongoose';
import { Category } from './Transaction';

export interface IRecurringTransaction extends Document {
    user: mongoose.Schema.Types.ObjectId;
    amount: number;
    description: string;
    category: string;
    type: 'EXPENSE' | 'INCOME';
    dayOfMonth: number; // 1-31
    lastInjected: Date;
    isActive: boolean;
}

const RecurringTransactionSchema: Schema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    category: {
        type: String,
        enum: Object.values(Category),
        required: [true, 'Please add a category'],
    },
    type: {
        type: String,
        enum: ['EXPENSE', 'INCOME'],
        default: 'EXPENSE',
        required: [true, 'Please add a type'],
    },
    dayOfMonth: {
        type: Number,
        required: [true, 'Please add a day of month'],
        min: 1,
        max: 31,
    },
    lastInjected: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const RecurringTransaction = mongoose.model<IRecurringTransaction>('RecurringTransaction', RecurringTransactionSchema);

export default RecurringTransaction;
