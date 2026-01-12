import mongoose, { Schema, Document, Model } from "mongoose"

export interface IChatMessage extends Document {
    _id: mongoose.Types.ObjectId
    sessionId: mongoose.Types.ObjectId
    role: "user" | "assistant"
    content: string
    symbol?: string
    userId: string
    createdAt: Date
}

const ChatMessageSchema = new Schema<IChatMessage>(
    {
        sessionId: { type: Schema.Types.ObjectId, ref: "ChatSession", required: true },
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        symbol: { type: String },
        userId: { type: String, required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
)

// Index for efficient querying by session
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 })
// Index for querying by user
ChatMessageSchema.index({ userId: 1, createdAt: -1 })

const ChatMessage: Model<IChatMessage> =
    mongoose.models.ChatMessage ||
    mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema)

export default ChatMessage
