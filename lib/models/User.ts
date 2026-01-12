import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId
    name?: string
    email?: string
    emailVerified?: Date
    image?: string
    password?: string
    createdAt: Date
    updatedAt: Date
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String },
        email: { type: String, unique: true, sparse: true },
        emailVerified: { type: Date },
        image: { type: String },
        password: { type: String },
    },
    { timestamps: true }
)

// Prevent model overwrite in development with hot reload
const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
