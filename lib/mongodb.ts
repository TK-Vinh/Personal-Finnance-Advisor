import mongoose from "mongoose"

declare global {
    var mongooseConnection: Promise<typeof mongoose> | undefined
}

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable")
}

let cached = global.mongooseConnection

async function dbConnect(): Promise<typeof mongoose> {
    if (cached) {
        return cached
    }

    cached = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
    })

    global.mongooseConnection = cached

    return cached
}

export default dbConnect
