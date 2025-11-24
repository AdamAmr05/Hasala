import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupExpense extends Document {
    groupId: mongoose.Schema.Types.ObjectId;
    payer: mongoose.Schema.Types.ObjectId;
    amount: number;
    description: string;
    date: Date;
    splitDetails: {
        user: mongoose.Schema.Types.ObjectId;
        amount: number;
    }[];
    isSettlement: boolean;
    category?: string;
}

const GroupExpenseSchema: Schema = new Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SplitGroup',
        required: true,
    },
    payer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Amount must be positive'], // Stored as decimal (e.g., 50.00)
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    splitDetails: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Split amount must be non-negative'], // Can be 0 if not participating
        }
    }],
    isSettlement: {
        type: Boolean,
        default: false,
    },
    category: {
        type: String,
        default: 'General',
    }
}, {
    timestamps: true,
});

const GroupExpense = mongoose.model<IGroupExpense>('GroupExpense', GroupExpenseSchema);

export default GroupExpense;
