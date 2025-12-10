import mongoose, { Document, Schema } from 'mongoose';

export interface IFamilyGroup extends Document {
    name: string;
    members: {
        user: mongoose.Types.ObjectId;
        role: 'ADMIN' | 'MEMBER';
        joinedAt: Date;
    }[];
    inviteCode: string;
}

const FamilyGroupSchema: Schema = new Schema({
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
        role: {
            type: String,
            enum: ['ADMIN', 'MEMBER'],
            default: 'MEMBER',
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
}, {
    timestamps: true,
});

const FamilyGroup = mongoose.model<IFamilyGroup>('FamilyGroup', FamilyGroupSchema);

export default FamilyGroup;
