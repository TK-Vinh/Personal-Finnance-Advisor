"use client"

import { useState, useEffect, useCallback } from "react"
import { Send, Sparkles } from "lucide-react"
import ChatMessage from "./chat-message"
import SuggestedPrompts from "./suggested-prompts"
import { chatWithGemini, proxyGetSymbolFullData } from "@/app/actions"
import {
  saveChatMessage,
  getChatHistory,
  autoGenerateSessionTitle
} from "@/app/actions/user"
import { buildAnalysisContext } from "@/lib/gemini"

interface ChatInterfaceProps {
  selectedSymbol: string
  sessionId: string | null
  onFirstMessage?: () => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  timestamp: Date
}

// Extract stock symbol from user message
const extractStockSymbol = (message: string): string | null => {
  const upperMessage = message.toUpperCase()

  // Pattern 1: "phân tích cổ phiếu XXX" or "đánh giá XXX" or "XXX thế nào"
  const patterns = [
    /(?:phân tích|đánh giá|phân tích cổ phiếu|xem|cho tôi biết về|về|nhận định)\s+(?:cổ phiếu\s+)?([A-Z]{3})/i,
    /^([A-Z]{3})(?:\s+thế nào|\s+như thế nào|\s+ra sao)?$/i,
    /([A-Z]{3})\s+(?:thế nào|như thế nào|ra sao|hôm nay|giá|cổ phiếu)/i,
    /^([A-Z]{3})$/i, // Just the symbol alone
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      const symbol = match[1].toUpperCase()
      // Validate it looks like a Vietnamese stock symbol (3 uppercase letters)
      if (/^[A-Z]{3}$/.test(symbol)) {
        return symbol
      }
    }
  }

  // Fallback: look for any 3-letter uppercase word that could be a symbol
  const words = upperMessage.split(/\s+/)
  for (const word of words) {
    if (/^[A-Z]{3}$/.test(word)) {
      // Common Vietnamese stock symbols
      const commonSymbols = ['VNM', 'FPT', 'HPG', 'VIC', 'VHM', 'MSN', 'VCB', 'BID', 'CTG', 'TCB', 'MBB', 'ACB', 'NVL', 'PDR', 'VRE', 'KDH', 'DXG', 'SSI', 'VND', 'HCM']
      if (commonSymbols.includes(word)) {
        return word
      }
    }
  }

  return null
}

export default function ChatInterface({ selectedSymbol, sessionId, onFirstMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isFirstMessage, setIsFirstMessage] = useState(true)

  // Load chat history when sessionId changes
  useEffect(() => {
    const loadHistory = async () => {
      if (!sessionId) {
        // No session - show welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: `Xin chào! 👋 Tôi là Trợ lý Giao dịch AI FireAnt. Tôi đang theo dõi mã ${selectedSymbol}. Tôi có thể giúp gì cho bạn?`,
            timestamp: new Date(),
          },
        ])
        setIsFirstMessage(true)
        return
      }

      setIsLoadingHistory(true)
      try {
        console.log("Loading history for session:", sessionId)
        const history = await getChatHistory(sessionId)
        console.log("Loaded history:", history)

        if (history.length === 0) {
          // New session - show welcome message
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: `Xin chào! 👋 Tôi là Trợ lý Giao dịch AI FireAnt. Tôi đang theo dõi mã ${selectedSymbol}. Tôi có thể giúp gì cho bạn?`,
              timestamp: new Date(),
            },
          ])
          setIsFirstMessage(true)
        } else {
          // Load existing messages
          setMessages(
            history.map((msg) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant",
              content: msg.content,
              timestamp: new Date(msg.createdAt),
            }))
          )
          setIsFirstMessage(false)
        }
      } catch (error) {
        console.error("Failed to load chat history:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadHistory()
  }, [sessionId, selectedSymbol])

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    const currentInput = input
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Save user message to database
      const savedUserMsg = await saveChatMessage(sessionId, "user", currentInput, selectedSymbol)
      console.log("Saved user message:", savedUserMsg)

      // Auto-generate title on first message
      if (isFirstMessage) {
        await autoGenerateSessionTitle(sessionId, currentInput)
        setIsFirstMessage(false)
        onFirstMessage?.()
      }

      // Detect stock symbol from user message
      const detectedSymbol = extractStockSymbol(currentInput)
      const symbolToAnalyze = detectedSymbol || selectedSymbol

      // Fetch real context data for the detected or selected symbol
      const marketContextData = await proxyGetSymbolFullData(symbolToAnalyze)

      // Map history to Gemini format (exclude welcome message)
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: m.content }],
        }))

      // Build structured context using the new function
      const context = buildAnalysisContext(symbolToAnalyze, marketContextData)

      const response = await chatWithGemini(currentInput, history, context)

      // Save assistant message to database
      const savedAssistantMsg = await saveChatMessage(sessionId, "assistant", response, symbolToAnalyze)
      console.log("Saved assistant message:", savedAssistantMsg)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        thinking: `Đang phân tích dữ liệu thị trường và chỉ số tài chính của ${symbolToAnalyze}...`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Failed to get AI response:", error)
    } finally {
      setIsLoading(false)
    }
  }, [input, sessionId, selectedSymbol, messages, isFirstMessage, onFirstMessage])

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt)
  }

  if (isLoadingHistory) {
    return (
      <div className="flex-1 flex items-center justify-center glass-strong rounded-xl border border-border/20">
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Đang tải lịch sử trò chuyện...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 glass-strong rounded-xl border border-border/20 overflow-hidden">
      {/* No session selected */}
      {!sessionId && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <Sparkles className="w-12 h-12 text-primary/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Chọn hoặc tạo cuộc trò chuyện</h3>
            <p className="text-sm text-muted-foreground">
              Nhấn "Cuộc trò chuyện mới" để bắt đầu chat với AI
            </p>
          </div>
        </div>
      )}

      {/* Has session */}
      {sessionId && (
        <>
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
                    <p className="text-xs text-muted-foreground animate-pulse">Đang suy nghĩ...</p>
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
                placeholder="Hỏi tôi về xu hướng thị trường, phân tích kỹ thuật, hoặc dự báo cổ phiếu..."
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
            <p className="text-xs text-muted-foreground">Được hỗ trợ bởi FireAnt AI • Dữ liệu thị trường thời gian thực</p>
          </div>
        </>
      )}
    </div>
  )
}
