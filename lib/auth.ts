import NextAuth from "next-auth"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"

// MongoDB client for NextAuth adapter
const MONGODB_URI = process.env.MONGODB_URI

declare global {
    var _mongoClient: MongoClient | undefined
}

// Create client promise only if MONGODB_URI exists
const getClientPromise = () => {
    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable")
    }
    const client = global._mongoClient || new MongoClient(MONGODB_URI)
    if (process.env.NODE_ENV !== "production") {
        global._mongoClient = client
    }
    return client.connect()
}

// Only create the promise at runtime, not build time
const clientPromise = MONGODB_URI ? getClientPromise() : (Promise.resolve(null) as any)

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: MONGODB_URI ? MongoDBAdapter(clientPromise) : undefined,
    providers: [
        Google({}),
        GitHub({}),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                // Connect to MongoDB
                await dbConnect()

                const user = await User.findOne({
                    email: credentials.email as string,
                })

                if (!user || !user.password) return null

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) return null

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            return session
        },
    },
})

