import mongoose, { Document, Schema } from 'mongoose';

export interface IChatThread extends Document {
    user: mongoose.Schema.Types.ObjectId;
    title: string;
    lastMessageAt: Date;
}

const ChatThreadSchema: Schema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        default: 'New Chat',
    },
    lastMessageAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const ChatThread = mongoose.model<IChatThread>('ChatThread', ChatThreadSchema);

export default ChatThread;
