// Vnstock API Utility interface

export interface VnstockQuote {
    symbol: string
    price: number
    change: number
    percentChange: number
    volume: number
    high: number
    low: number
    open: number
}

// This will call our Python bridge or a compatible REST API
const BRIDGE_URL = process.env.VNSTOCK_BRIDGE_URL || "http://localhost:8000"

export const getVnstockQuote = async (symbol: string): Promise<VnstockQuote | null> => {
    try {
        const response = await fetch(`${BRIDGE_URL}/quote/${symbol}`)
        if (!response.ok) return null
        return await response.json()
    } catch (error) {
        console.error(`Error fetching Vnstock quote for ${symbol}:`, error)
        return null
    }
}

export const getVnstockFinancials = async (symbol: string) => {
    try {
        const response = await fetch(`${BRIDGE_URL}/financials/${symbol}`)
        if (!response.ok) return null
        return await response.json()
    } catch (error) {
        console.error(`Error fetching Vnstock financials for ${symbol}:`, error)
        return null
    }
}

export const searchVnstockSymbols = async (query: string) => {
    try {
        const response = await fetch(`${BRIDGE_URL}/search?query=${encodeURIComponent(query)}`)
        if (!response.ok) return []
        return await response.json()
    } catch (error) {
        console.error(`Error searching symbols in Vnstock:`, error)
        return []
    }
}
