import mongoose, { Schema, Document } from 'mongoose';

export interface ISavingsGoal extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color: string;
    icon: string;
    deadline?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SavingsGoalSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    color: { type: String, default: '#007AFF' },
    icon: { type: String, default: '💰' },
    deadline: { type: Date },
}, {
    timestamps: true
});

export default mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);
