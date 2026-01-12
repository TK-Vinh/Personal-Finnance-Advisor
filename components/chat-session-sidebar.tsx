"use client"

import { useState } from "react"
import { Plus, MessageSquare, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface ChatSessionItem {
    id: string
    title: string
    symbol?: string
    createdAt: Date
    updatedAt: Date
}

interface ChatSessionSidebarProps {
    sessions: ChatSessionItem[]
    activeSessionId: string | null
    onSelectSession: (sessionId: string) => void
    onNewSession: () => void
    onDeleteSession: (sessionId: string) => void
    isLoading?: boolean
}

export default function ChatSessionSidebar({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewSession,
    onDeleteSession,
    isLoading,
}: ChatSessionSidebarProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation()
        setDeletingId(sessionId)
        await onDeleteSession(sessionId)
        setDeletingId(null)
    }

    return (
        <div className="w-64 flex flex-col glass-strong rounded-xl border border-border/20 overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-border/20">
                <Button
                    onClick={onNewSession}
                    disabled={isLoading}
                    className="w-full justify-start gap-2"
                    variant="outline"
                >
                    <Plus className="w-4 h-4" />
                    Cuộc trò chuyện mới
                </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {sessions.length === 0 ? (
                        <div className="px-3 py-8 text-center text-muted-foreground text-sm">
                            Chưa có cuộc trò chuyện nào
                        </div>
                    ) : (
                        sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeSessionId === session.id
                                        ? "bg-primary/20 border border-primary/30"
                                        : "hover:bg-muted/50"
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {session.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(session.updatedAt), {
                                            addSuffix: true,
                                            locale: vi,
                                        })}
                                    </p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreVertical className="w-3 h-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => handleDelete(e, session.id)}
                                            disabled={deletingId === session.id}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            {deletingId === session.id ? "Đang xóa..." : "Xóa"}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
