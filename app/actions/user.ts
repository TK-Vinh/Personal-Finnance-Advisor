"use server"

import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import { Watchlist, Note, ChatMessage, ChatSession } from "@/lib/models"
import { revalidatePath } from "next/cache"

// ============== WATCHLIST ==============

export async function getWatchlist() {
    const session = await auth()
    if (!session?.user?.id) return []

    await dbConnect()

    const watchlist = await Watchlist.find({
        userId: session.user.id,
    }).sort({ createdAt: -1 })

    return watchlist.map((item) => item.symbol)
}

export async function addToWatchlist(symbol: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await dbConnect()

    await Watchlist.findOneAndUpdate(
        { userId: session.user.id, symbol: symbol },
        { userId: session.user.id, symbol: symbol },
        { upsert: true, new: true }
    )

    revalidatePath("/")
}

export async function removeFromWatchlist(symbol: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await dbConnect()

    await Watchlist.deleteOne({
        userId: session.user.id,
        symbol: symbol,
    })

    revalidatePath("/")
}

// ============== NOTES ==============

export async function saveNote(title: string, content: string, symbol?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await dbConnect()

    await Note.create({
        title,
        content,
        symbol,
        userId: session.user.id,
    })

    revalidatePath("/")
}

export async function getNotes(symbol?: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    await dbConnect()

    const query: { userId: string; symbol?: string } = {
        userId: session.user.id,
    }
    if (symbol) query.symbol = symbol

    const notes = await Note.find(query).sort({ createdAt: -1 })

    return notes.map((note) => ({
        id: note._id.toString(),
        title: note.title,
        content: note.content,
        symbol: note.symbol,
        userId: note.userId.toString(),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
    }))
}

// ============== CHAT SESSIONS ==============

export async function createChatSession(symbol?: string, title?: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await dbConnect()

    const chatSession = await ChatSession.create({
        title: title || "Cuộc trò chuyện mới",
        userId: session.user.id,
        symbol,
    })

    revalidatePath("/")

    return {
        id: chatSession._id.toString(),
        title: chatSession.title,
        symbol: chatSession.symbol,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
    }
}

export async function getChatSessions() {
    const session = await auth()
    if (!session?.user?.id) return []

    await dbConnect()

    const sessions = await ChatSession.find({
        userId: session.user.id,
    }).sort({ updatedAt: -1 })

    return sessions.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        symbol: s.symbol,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
    }))
}

export async function getChatSessionById(sessionId: string) {
    const session = await auth()
    if (!session?.user?.id) return null

    await dbConnect()

    const chatSession = await ChatSession.findOne({
        _id: sessionId,
        userId: session.user.id,
    })

    if (!chatSession) return null

    return {
        id: chatSession._id.toString(),
        title: chatSession.title,
        symbol: chatSession.symbol,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
    }
}

export async function updateSessionTitle(sessionId: string, title: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await dbConnect()

    await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId: session.user.id },
        { title }
    )

    revalidatePath("/")
}

export async function deleteChatSession(sessionId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    await dbConnect()

    // Delete all messages in the session
    await ChatMessage.deleteMany({
        sessionId: sessionId,
        userId: session.user.id,
    })

    // Delete the session
    await ChatSession.deleteOne({
        _id: sessionId,
        userId: session.user.id,
    })

    revalidatePath("/")
}

// ============== CHAT MESSAGES ==============

export async function saveChatMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    symbol?: string
) {
    const session = await auth()
    if (!session?.user?.id) return null

    await dbConnect()

    try {
        // Import mongoose for ObjectId conversion
        const mongoose = await import("mongoose")
        const sessionObjectId = new mongoose.Types.ObjectId(sessionId)

        // Update session's updatedAt timestamp
        await ChatSession.findByIdAndUpdate(sessionId, { updatedAt: new Date() })

        const message = await ChatMessage.create({
            sessionId: sessionObjectId,
            role,
            content,
            symbol,
            userId: session.user.id,
        })

        return {
            id: message._id.toString(),
            sessionId: sessionId,
            role: message.role,
            content: message.content,
            symbol: message.symbol,
            createdAt: message.createdAt,
        }
    } catch (error) {
        console.error("Error saving chat message:", error)
        return null
    }
}

export async function getChatHistory(sessionId: string) {
    const session = await auth()
    if (!session?.user?.id) return []

    await dbConnect()

    // Import mongoose for ObjectId conversion
    const mongoose = await import("mongoose")

    const messages = await ChatMessage.find({
        sessionId: new mongoose.Types.ObjectId(sessionId),
        userId: session.user.id,
    }).sort({ createdAt: 1 })

    return messages.map((msg) => ({
        id: msg._id.toString(),
        sessionId: msg.sessionId.toString(),
        role: msg.role,
        content: msg.content,
        symbol: msg.symbol,
        createdAt: msg.createdAt,
    }))
}

// Auto-generate session title from first user message
export async function autoGenerateSessionTitle(sessionId: string, firstMessage: string) {
    const session = await auth()
    if (!session?.user?.id) return

    await dbConnect()

    // Generate title from first 50 characters of the message
    const title = firstMessage.length > 50
        ? firstMessage.substring(0, 50) + "..."
        : firstMessage

    await ChatSession.findOneAndUpdate(
        { _id: sessionId, userId: session.user.id, title: "Cuộc trò chuyện mới" },
        { title }
    )
}
