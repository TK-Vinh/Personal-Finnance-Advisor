import mongoose, { Schema, Document, Model } from "mongoose"

export interface IVerificationToken extends Document {
    identifier: string
    token: string
    expires: Date
}

const VerificationTokenSchema = new Schema<IVerificationToken>({
    identifier: { type: String, required: true },
    token: { type: String, unique: true, required: true },
    expires: { type: Date, required: true },
})

// Compound unique index
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true })

const VerificationToken: Model<IVerificationToken> =
    mongoose.models.VerificationToken ||
    mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema)

export default VerificationToken
