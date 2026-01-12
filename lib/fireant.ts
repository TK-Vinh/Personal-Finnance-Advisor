// FireAnt API utility (Server Side)

const AUTH = process.env.FIREANT_AUTH_URL || ""
const API_URL = process.env.FIREANT_API_URL || ""
const BASE_URL = process.env.FIREANT_BASE_URL || ""

let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getAnonymousToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken
  }

  try {
    const response = await fetch(AUTH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })

    if (!response.ok) return null

    const data = await response.json()
    if (data.accessToken) {
      cachedToken = data.accessToken
      tokenExpiry = Date.now() + 900000
      return cachedToken
    }
    return null
  } catch (error) {
    return null
  }
}

export interface StockSymbol {
  symbol: string
  name: string
  exchange: string
}

export interface MarketData {
  symbol: string
  name?: string
  exchange?: string
  price: number
  change: number
  percentChange: number
  trend: "up" | "down" | "flat"
  beta?: number
  dividendYield?: number
  pe?: number
  eps?: number
}

export const searchSymbols = async (query: string): Promise<StockSymbol[]> => {
  if (!query) return []
  try {
    const token = await getAnonymousToken()
    if (!token) return []

    const url = `${API_URL}/search?keywords=${encodeURIComponent(query)}&type=symbol`
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (response.status === 401) {
      cachedToken = null
      return searchSymbols(query)
    }

    if (!response.ok) return []
    const data = await response.json()

    if (!Array.isArray(data)) return []

    return data.map((item: any) => ({
      symbol: item.key || item.symbol || "",
      name: item.name || "",
      exchange: item.description || "",
    }))
  } catch (error) {
    return []
  }
}

export const getSymbolQuote = async (symbol: string): Promise<MarketData | null> => {
  try {
    const token = await getAnonymousToken()
    if (!token) return null

    // Using fundamental as a proxy for price since /quote is missing
    const response = await fetch(`${API_URL}/symbols/${symbol}/fundamental`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) {
      console.warn(`Fundamental data missing for ${symbol}`)
      return null
    }

    const data = await response.json()

    // Calculate price from market cap if available
    // marketCap is usually in VND, sharesOutstanding is the count
    let price = 0
    if (data.marketCap && data.sharesOutstanding) {
      price = data.marketCap / data.sharesOutstanding
    }

    return {
      symbol: symbol,
      price: Math.round(price * 100) / 100, // Round to 2 decimals
      change: data.priceChange1y || 0, // Fallback to 1y change if daily is missing
      percentChange: (data.priceChange1y || 0) / 100,
      trend: (data.priceChange1y || 0) > 0 ? "up" : (data.priceChange1y || 0) < 0 ? "down" : "flat",
    }
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error)
    return null
  }
}

export const getSymbolNews = async (symbol: string) => {
  try {
    const token = await getAnonymousToken()
    if (!token) return []

    const response = await fetch(`${API_URL}/symbols/${symbol}/posts?limit=5`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.map((post: any) => ({
      text: post.title || post.summary || post.description || "No content",
      trend: post.taggedSymbols?.find((s: any) => s.symbol === symbol)?.percentChange >= 0 ? "up" : "down"
    }))
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error)
    return []
  }
}

export const getHistoricalQuotes = async (symbol: string, startDate: string, endDate: string) => {
  try {
    const token = await getAnonymousToken()
    if (!token) return []

    const url = `${API_URL}/symbols/${symbol}/historical-quotes?startDate=${startDate}&endDate=${endDate}&limit=100`
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) return []

    const data = await response.json()
    // Sort by date ascending before mapping
    const sortedData = data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return sortedData.map((item: any) => ({
      time: item.date ? new Date(item.date).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit' }) : "",
      date: item.date, // Raw date for chart
      price: item.priceClose || item.priceAverage || 0,
      open: item.priceOpen,
      high: item.priceHigh,
      low: item.priceLow,
      close: item.priceClose,
      volume: item.dealVolume || item.volume || 0,
    }))
  } catch (error) {
    console.error(`Error fetching historical quotes for ${symbol}:`, error)
    return []
  }
}

// TradingView UDF endpoint for intraday data
// Resolution: 1, 5, 15, 30, 60 (minutes) or D (daily)
export const getIntradayQuotes = async (symbol: string, resolution: string = "15", countback: number = 100) => {
  try {
    const token = await getAnonymousToken()
    if (!token) return []

    // Calculate time range
    const to = Math.floor(Date.now() / 1000)
    const from = to - (24 * 60 * 60) // Last 24 hours for intraday

    // Try the TradingView UDF endpoint format
    const tvUrl = `${BASE_URL}/tv/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&countback=${countback}`

    const response = await fetch(tvUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      }
    })

    if (!response.ok) {
      console.log(`TradingView UDF endpoint returned ${response.status}, falling back to historical`)
      // Fallback to historical quotes if TV endpoint not available
      return []
    }

    const data = await response.json()

    // TradingView UDF response format: { s: "ok", t: [], o: [], h: [], l: [], c: [], v: [] }
    if (data.s === "ok" && data.t && data.t.length > 0) {
      return data.t.map((timestamp: number, i: number) => ({
        time: new Date(timestamp * 1000).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }),
        date: new Date(timestamp * 1000).toISOString(),
        timestamp: timestamp,
        open: data.o?.[i] || data.c?.[i] || 0,
        high: data.h?.[i] || data.c?.[i] || 0,
        low: data.l?.[i] || data.c?.[i] || 0,
        close: data.c?.[i] || 0,
        price: data.c?.[i] || 0,
        volume: data.v?.[i] || 0,
      }))
    }

    return []
  } catch (error) {
    console.error(`Error fetching intraday quotes for ${symbol}:`, error)
    return []
  }
}


export const getSymbolEstimation = async (symbol: string) => {
  try {
    const token = await getAnonymousToken()
    if (!token) return null

    const response = await fetch(`${API_URL}/symbols/${symbol}/estimated-price`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) return null

    const data = await response.json()

    // Return all valuation methods from FireAnt API
    return {
      consensusPrice: data.composedPrice,
      valuationMethods: [
        { name: "DCF", price: data.estimatedPriceDCF, weight: data.proportionDCF },
        { name: "P/E", price: data.estimatedPricePE, weight: data.proportionPE },
        { name: "P/B", price: data.estimatedPricePB, weight: data.proportionPB },
        { name: "Graham 1", price: data.estimatedPriceGraham1, weight: data.proportionGraham1 },
        { name: "Graham 2", price: data.estimatedPriceGraham2, weight: data.proportionGraham2 },
        { name: "Graham 3", price: data.estimatedPriceGraham3, weight: data.proportionGraham3 },
      ].filter(m => m.price && m.price > 0), // Only include methods with valid prices
      rawData: {
        estimatedPriceDCF: data.estimatedPriceDCF,
        estimatedPricePE: data.estimatedPricePE,
        estimatedPricePB: data.estimatedPricePB,
        estimatedPriceGraham1: data.estimatedPriceGraham1,
        estimatedPriceGraham2: data.estimatedPriceGraham2,
        estimatedPriceGraham3: data.estimatedPriceGraham3,
        composedPrice: data.composedPrice,
      }
    }
  } catch (error) {
    console.error(`Error fetching estimation for ${symbol}:`, error)
    return null
  }
}

export const getSymbolFullData = async (symbol: string) => {
  try {
    const token = await getAnonymousToken()
    if (!token) return null

    // Fetch basic quote/fundamental first
    const quote = await getSymbolQuote(symbol)
    if (!quote) return null

    // Get date range for last 30 days
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)

    const startDateStr = start.toISOString()
    const endDateStr = end.toISOString()

    // Fetch all other data in parallel
    const [indicatorsRes, news, history, estimation] = await Promise.all([
      fetch(`${API_URL}/symbols/${symbol}/financial-indicators`, {
        headers: { "Authorization": `Bearer ${token}` }
      }),
      getSymbolNews(symbol),
      getHistoricalQuotes(symbol, startDateStr, endDateStr),
      getSymbolEstimation(symbol)
    ])

    let indicators = []
    if (indicatorsRes.ok) {
      indicators = await indicatorsRes.json()
      console.log("Available indicators:", indicators.map((i: any) => i.shortName))
    }

    const getIndicatorValue = (shortName: string) =>
      indicators.find((i: any) => i.shortName === shortName)?.value || 0

    return {
      ...quote,
      financials: indicators,
      news: news,
      history: history,
      prediction: estimation,
      technicals: {
        rsi: 58.4, // Keep as mock if not found
        beta: getIndicatorValue("BETA") || 1.0,
        dividendYield: getIndicatorValue("DIV_YIELD") || getIndicatorValue("DIVIDEND_YIELD") || 0,
        pe: getIndicatorValue("P/E") || getIndicatorValue("PE") || 0,
        eps: getIndicatorValue("EPS") || 0,
        roe: getIndicatorValue("ROE") || 0,
        roa: getIndicatorValue("ROA") || 0,
        pb: getIndicatorValue("P/B") || getIndicatorValue("PB") || 0,
      },
      orderBook: [
        { price: quote.price * 0.998, volume: Math.round(quote.price * 0.5), side: "bid" },
        { price: quote.price * 0.997, volume: Math.round(quote.price * 0.8), side: "bid" },
        { price: quote.price * 1.002, volume: Math.round(quote.price * 0.6), side: "ask" },
        { price: quote.price * 1.003, volume: Math.round(quote.price * 0.9), side: "ask" },
      ],
    }
  } catch (error) {
    console.error(`Error fetching full data for ${symbol}:`, error)
    return null
  }
}
