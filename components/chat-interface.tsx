"use client"

import { useState } from "react"
import { Send, Sparkles } from "lucide-react"
import ChatMessage from "./chat-message"
import SuggestedPrompts from "./suggested-prompts"
import { chatWithGemini, proxyGetSymbolFullData } from "@/app/actions"

interface ChatInterfaceProps {
  selectedSymbol: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  timestamp: Date
}

export default function ChatInterface({ selectedSymbol }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        `Hello! 👋 I'm your FireAnt AI Trading Assistant. I'm currently monitoring ${selectedSymbol}. How can I help you analyze it?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Fetch real context data
      const marketContextData = await proxyGetSymbolFullData(selectedSymbol)

      // Map history to Gemini format
      const history = messages.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      }))

      const context = `
        The user is currently looking at stock symbol: ${selectedSymbol}.
        Current Market Data: ${JSON.stringify(marketContextData)}
        Analyze the data and provide helpful trading insights.
      `
      const response = await chatWithGemini(input, history, context)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        thinking: `Analyzing ${selectedSymbol} market data and financial indicators...`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to get AI response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 glass-strong rounded-xl border border-border/20 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && <SuggestedPrompts onSelectPrompt={handlePromptSelect} />}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="inline-block px-4 py-2 rounded-lg glass border border-border/20">
                <p className="text-xs text-muted-foreground animate-pulse">Thinking...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/20 p-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Ask me about market trends, technical analysis, or stock predictions..."
            className="flex-1 px-4 py-3 rounded-lg bg-input border border-border/30 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Powered by FireAnt AI • Real-time market data</p>
      </div>
    </div>
  )
}
