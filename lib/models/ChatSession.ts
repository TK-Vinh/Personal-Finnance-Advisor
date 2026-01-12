import mongoose, { Schema, Document, Model } from "mongoose"

export interface IChatSession extends Document {
    _id: mongoose.Types.ObjectId
    title: string
    userId: string
    symbol?: string
    createdAt: Date
    updatedAt: Date
}

const ChatSessionSchema = new Schema<IChatSession>(
    {
        title: { type: String, required: true, default: "Cuộc trò chuyện mới" },
        userId: { type: String, required: true },
        symbol: { type: String },
    },
    { timestamps: true }
)

// Index for efficient querying by user
ChatSessionSchema.index({ userId: 1, updatedAt: -1 })

const ChatSession: Model<IChatSession> =
    mongoose.models.ChatSession ||
    mongoose.model<IChatSession>("ChatSession", ChatSessionSchema)

export default ChatSession
