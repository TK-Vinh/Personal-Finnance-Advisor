"use server"

import { getGeminiResponse, ChatMessage as GeminiChatMessage } from "@/lib/gemini"
import { searchSymbols, getSymbolQuote, getSymbolFullData } from "@/lib/fireant"

export async function chatWithGemini(prompt: string, history: GeminiChatMessage[], context: string) {
    return await getGeminiResponse(prompt, history, context)
}

export async function proxyGetSymbolQuote(symbol: string) {
    return await getSymbolQuote(symbol)
}

export async function proxyGetSymbolFullData(symbol: string) {
    return await getSymbolFullData(symbol)
}
