"use client"

import { Sparkles } from "lucide-react"

interface ChatMessageProps {
  message: {
    role: "user" | "assistant"
    content: string
    thinking?: string
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-md px-4 py-3 rounded-lg bg-primary/20 border border-primary/30 text-foreground text-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 space-y-2">
        {message.thinking && (
          <div className="inline-block px-4 py-2 rounded-lg glass border border-border/20">
            <p className="text-xs text-muted-foreground">{message.thinking}</p>
          </div>
        )}
        <div className="inline-block px-4 py-3 rounded-lg glass border border-border/20 text-sm text-foreground max-w-md">
          {message.content}
        </div>
      </div>
    </div>
  )
}
