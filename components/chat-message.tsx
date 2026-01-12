"use client"

import { Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"

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
        <div className="px-4 py-3 rounded-lg glass border border-border/20 text-sm text-foreground max-w-2xl prose prose-invert prose-sm">
          <ReactMarkdown
            components={{
              // Headers
              h1: ({ children }) => <h1 className="text-lg font-bold text-primary mt-4 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold text-primary mt-3 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold text-primary mt-2 mb-1">{children}</h3>,
              h4: ({ children }) => <h4 className="text-sm font-semibold text-primary/90 mt-2 mb-1">{children}</h4>,
              // Bold text
              strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
              // Italic text
              em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
              // Paragraphs
              p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
              // Lists
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
              li: ({ children }) => <li className="text-foreground">{children}</li>,
              // Code
              code: ({ children }) => (
                <code className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-mono">{children}</code>
              ),
              // Blockquote
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">
                  {children}
                </blockquote>
              ),
              // Horizontal rule
              hr: () => <hr className="border-border/30 my-3" />,
              // Links
              a: ({ href, children }) => (
                <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
