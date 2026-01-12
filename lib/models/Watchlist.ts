import mongoose, { Schema, Document, Model } from "mongoose"

export interface IWatchlist extends Document {
    _id: mongoose.Types.ObjectId
    symbol: string
    userId: mongoose.Types.ObjectId
    createdAt: Date
}

const WatchlistSchema = new Schema<IWatchlist>(
    {
        symbol: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
)

// Compound unique index: one user can only add a symbol once
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true })

const Watchlist: Model<IWatchlist> =
    mongoose.models.Watchlist || mongoose.model<IWatchlist>("Watchlist", WatchlistSchema)

export default Watchlist
