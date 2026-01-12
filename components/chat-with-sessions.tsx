"use client"

import { useState, useEffect, useCallback } from "react"
import ChatInterface from "./chat-interface"
import ChatSessionSidebar from "./chat-session-sidebar"
import {
    getChatSessions,
    createChatSession,
    deleteChatSession
} from "@/app/actions/user"

interface ChatSession {
    id: string
    title: string
    symbol?: string
    createdAt: Date
    updatedAt: Date
}

interface ChatWithSessionsProps {
    selectedSymbol: string
}

export default function ChatWithSessions({ selectedSymbol }: ChatWithSessionsProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load sessions on mount
    useEffect(() => {
        const loadSessions = async () => {
            setIsLoading(true)
            try {
                const loadedSessions = await getChatSessions()
                setSessions(loadedSessions)
                // Auto-select first session if exists
                if (loadedSessions.length > 0 && !activeSessionId) {
                    setActiveSessionId(loadedSessions[0].id)
                }
            } catch (error) {
                console.error("Failed to load sessions:", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadSessions()
    }, [])

    const handleNewSession = useCallback(async () => {
        setIsLoading(true)
        try {
            const newSession = await createChatSession(selectedSymbol)
            setSessions((prev) => [newSession, ...prev])
            setActiveSessionId(newSession.id)
        } catch (error) {
            console.error("Failed to create session:", error)
        } finally {
            setIsLoading(false)
        }
    }, [selectedSymbol])

    const handleSelectSession = useCallback((sessionId: string) => {
        setActiveSessionId(sessionId)
    }, [])

    const handleDeleteSession = useCallback(async (sessionId: string) => {
        try {
            await deleteChatSession(sessionId)
            setSessions((prev) => prev.filter((s) => s.id !== sessionId))
            // If deleted session was active, switch to first available
            if (activeSessionId === sessionId) {
                const remaining = sessions.filter((s) => s.id !== sessionId)
                setActiveSessionId(remaining.length > 0 ? remaining[0].id : null)
            }
        } catch (error) {
            console.error("Failed to delete session:", error)
        }
    }, [activeSessionId, sessions])

    // Refresh sessions when first message is sent (to update title)
    const handleFirstMessage = useCallback(async () => {
        try {
            const loadedSessions = await getChatSessions()
            setSessions(loadedSessions)
        } catch (error) {
            console.error("Failed to refresh sessions:", error)
        }
    }, [])

    return (
        <div className="flex-1 flex gap-4 min-w-0">
            <ChatSessionSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                onDeleteSession={handleDeleteSession}
                isLoading={isLoading}
            />
            <ChatInterface
                selectedSymbol={selectedSymbol}
                sessionId={activeSessionId}
                onFirstMessage={handleFirstMessage}
            />
        </div>
    )
}
