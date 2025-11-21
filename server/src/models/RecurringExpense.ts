import mongoose, { Document, Schema } from 'mongoose';
import { Category } from './Transaction';

export interface IRecurringExpense extends Document {
    user: mongoose.Schema.Types.ObjectId;
    amount: number;
    description: string;
    category: Category;
    dayOfMonth: number; // 1-31
    lastInjected: Date;
    isActive: boolean;
}

const RecurringExpenseSchema: Schema = new Schema({
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
    dayOfMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 31,
    },
    lastInjected: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

const RecurringExpense = mongoose.model<IRecurringExpense>('RecurringExpense', RecurringExpenseSchema);

export default RecurringExpense;
