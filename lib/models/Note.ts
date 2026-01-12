import mongoose, { Schema, Document, Model } from "mongoose"

export interface INote extends Document {
    _id: mongoose.Types.ObjectId
    title: string
    content: string
    symbol?: string
    userId: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const NoteSchema = new Schema<INote>(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        symbol: { type: String },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
)

// Index for efficient querying by user
NoteSchema.index({ userId: 1, createdAt: -1 })

const Note: Model<INote> =
    mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema)

export default Note
