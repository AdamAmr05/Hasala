import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
    thread: mongoose.Schema.Types.ObjectId;
    role: 'user' | 'model';
    text: string;
    toolCalls?: any[];
}

const ChatMessageSchema: Schema = new Schema({
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ChatThread',
    },
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true,
    },
    text: {
        type: String,
        default: '',
    },
    toolCalls: {
        type: [Schema.Types.Mixed],
        default: [],
    },
}, {
    timestamps: true,
});

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
