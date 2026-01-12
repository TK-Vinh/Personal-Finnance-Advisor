import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISession extends Document {
    _id: mongoose.Types.ObjectId
    sessionToken: string
    userId: mongoose.Types.ObjectId
    expires: Date
}

const SessionSchema = new Schema<ISession>({
    sessionToken: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expires: { type: Date, required: true },
})

const Session: Model<ISession> =
    mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema)

export default Session
