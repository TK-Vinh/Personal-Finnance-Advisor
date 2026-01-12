"use server"

import { getGeminiResponse, ChatMessage as GeminiChatMessage } from "@/lib/gemini"
import { searchSymbols, getSymbolQuote, getSymbolFullData, getHistoricalQuotes, getIntradayQuotes } from "@/lib/fireant"

export async function chatWithGemini(prompt: string, history: GeminiChatMessage[], context: string) {
    return await getGeminiResponse(prompt, history, context)
}

export async function proxyGetSymbolQuote(symbol: string) {
    return await getSymbolQuote(symbol)
}

export async function proxyGetSymbolFullData(symbol: string) {
    return await getSymbolFullData(symbol)
}

export async function proxyGetHistoricalQuotes(symbol: string, startDate: string, endDate: string) {
    return await getHistoricalQuotes(symbol, startDate, endDate)
}

export async function proxyGetIntradayQuotes(symbol: string, resolution: string = "15") {
    return await getIntradayQuotes(symbol, resolution, 100)
}
