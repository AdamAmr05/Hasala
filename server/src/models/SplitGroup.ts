import mongoose, { Document, Schema } from 'mongoose';

export interface ISplitGroup extends Document {
    name: string;
    members: {
        user: mongoose.Schema.Types.ObjectId;
        joinedAt: Date;
    }[];
    inviteCode: string;
    currency: string;
    createdBy: mongoose.Schema.Types.ObjectId;
}

const SplitGroupSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    inviteCode: {
        type: String,
        unique: true,
        required: true,
    },
    currency: {
        type: String,
        default: 'EGP',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true,
});

const SplitGroup = mongoose.model<ISplitGroup>('SplitGroup', SplitGroupSchema);

export default SplitGroup;
