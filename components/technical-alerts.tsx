"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Loader2, ArrowUpCircle, ArrowDownCircle, MinusCircle } from "lucide-react"
import { MarketData } from "@/lib/fireant"
import { proxyGetSymbolFullData } from "@/app/actions"

interface TechnicalAlertsProps {
    pinnedSymbols: MarketData[]
}

interface StockAlert {
    symbol: string
    price: number
    rsi: number
    macd: { line: number; signal: number; histogram: number }
    signal: "BUY" | "SELL" | "HOLD"
    alerts: string[]
}

// Calculate RSI from price data
function calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50

    let gains = 0
    let losses = 0

    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1]
        if (change > 0) gains += change
        else losses -= change
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1]
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period
            avgLoss = (avgLoss * (period - 1)) / period
        } else {
            avgGain = (avgGain * (period - 1)) / period
            avgLoss = (avgLoss * (period - 1) - change) / period
        }
    }

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
}

// Calculate MACD
function calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
    if (prices.length < 26) return { line: 0, signal: 0, histogram: 0 }

    const ema = (data: number[], period: number): number[] => {
        const k = 2 / (period + 1)
        const result: number[] = [data[0]]
        for (let i = 1; i < data.length; i++) {
            result.push(data[i] * k + result[i - 1] * (1 - k))
        }
        return result
    }

    const ema12 = ema(prices, 12)
    const ema26 = ema(prices, 26)
    const macdLine = ema12.map((v, i) => v - ema26[i])
    const signalLine = ema(macdLine.slice(26), 9)

    const line = macdLine[macdLine.length - 1]
    const signal = signalLine[signalLine.length - 1] || 0

    return {
        line,
        signal,
        histogram: line - signal
    }
}

export default function TechnicalAlerts({ pinnedSymbols }: TechnicalAlertsProps) {
    const [alerts, setAlerts] = useState<StockAlert[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchAlerts = async () => {
            if (pinnedSymbols.length === 0) {
                setAlerts([])
                return
            }

            setIsLoading(true)
            try {
                const alertPromises = pinnedSymbols.map(async (stock) => {
                    const data = await proxyGetSymbolFullData(stock.symbol)
                    if (!data || !data.history || data.history.length === 0) {
                        return null
                    }

                    const prices = data.history.map((h: any) => h.close || h.price || 0).filter((p: number) => p > 0)

                    const rsi = calculateRSI(prices)
                    const macd = calculateMACD(prices)

                    const alertMessages: string[] = []
                    let signal: "BUY" | "SELL" | "HOLD" = "HOLD"

                    // RSI signals
                    if (rsi < 30) {
                        alertMessages.push("RSI quá bán (<30)")
                        signal = "BUY"
                    } else if (rsi > 70) {
                        alertMessages.push("RSI quá mua (>70)")
                        signal = "SELL"
                    }

                    // MACD signals
                    if (macd.histogram > 0 && macd.line > macd.signal) {
                        alertMessages.push("MACD cắt lên")
                        if (signal !== "SELL") signal = "BUY"
                    } else if (macd.histogram < 0 && macd.line < macd.signal) {
                        alertMessages.push("MACD cắt xuống")
                        if (signal !== "BUY") signal = "SELL"
                    }

                    // Breakout detection (simple: price above recent high)
                    if (prices.length > 20) {
                        const recentPrices = prices.slice(-20)
                        const currentPrice = prices[prices.length - 1]
                        const previousHigh = Math.max(...recentPrices.slice(0, -1))
                        if (currentPrice > previousHigh) {
                            alertMessages.push("Vượt đỉnh gần nhất")
                            if (signal !== "SELL") signal = "BUY"
                        }
                    }

                    return {
                        symbol: stock.symbol,
                        price: data.price || stock.price,
                        rsi,
                        macd,
                        signal,
                        alerts: alertMessages
                    }
                })

                const results = await Promise.all(alertPromises)
                setAlerts(results.filter((a): a is StockAlert => a !== null))
            } catch (error) {
                console.error("Error fetching alerts:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAlerts()
    }, [pinnedSymbols])

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case "BUY": return "text-success bg-success/20 border-success/30"
            case "SELL": return "text-destructive bg-destructive/20 border-destructive/30"
            default: return "text-muted-foreground bg-muted/20 border-muted/30"
        }
    }

    const getSignalIcon = (signal: string) => {
        switch (signal) {
            case "BUY": return <ArrowUpCircle className="w-5 h-5" />
            case "SELL": return <ArrowDownCircle className="w-5 h-5" />
            default: return <MinusCircle className="w-5 h-5" />
        }
    }

    const getRSIColor = (rsi: number) => {
        if (rsi < 30) return "text-success"
        if (rsi > 70) return "text-destructive"
        return "text-foreground"
    }

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="glass-strong rounded-xl border border-border/20 p-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Cảnh báo kỹ thuật
                </h2>
                <p className="text-sm text-muted-foreground">
                    Tín hiệu kỹ thuật cho các cổ phiếu đã ghim trong watchlist của bạn
                </p>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && pinnedSymbols.length === 0 && (
                <div className="glass-strong rounded-xl border border-border/20 p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có cổ phiếu nào</h3>
                    <p className="text-sm text-muted-foreground">
                        Ghim các cổ phiếu vào watchlist để xem cảnh báo kỹ thuật
                    </p>
                </div>
            )}

            {/* Alerts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alert) => (
                    <div key={alert.symbol} className="glass-strong rounded-xl border border-border/20 p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{alert.symbol}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {alert.price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                </p>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getSignalColor(alert.signal)}`}>
                                {getSignalIcon(alert.signal)}
                                <span className="font-bold text-sm">{alert.signal}</span>
                            </div>
                        </div>

                        {/* Indicators */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* RSI */}
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">RSI (14)</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl font-bold ${getRSIColor(alert.rsi)}`}>
                                        {alert.rsi.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {alert.rsi < 30 ? "Quá bán" : alert.rsi > 70 ? "Quá mua" : "Trung lập"}
                                    </span>
                                </div>
                                {/* RSI Bar */}
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${alert.rsi < 30 ? "bg-success" : alert.rsi > 70 ? "bg-destructive" : "bg-primary"}`}
                                        style={{ width: `${alert.rsi}%` }}
                                    />
                                </div>
                            </div>

                            {/* MACD */}
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">MACD</p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl font-bold ${alert.macd.histogram > 0 ? "text-success" : "text-destructive"}`}>
                                        {alert.macd.histogram > 0 ? "+" : ""}{alert.macd.histogram.toFixed(2)}
                                    </span>
                                    {alert.macd.histogram > 0 ? (
                                        <TrendingUp className="w-4 h-4 text-success" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-destructive" />
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Line: {alert.macd.line.toFixed(2)} | Signal: {alert.macd.signal.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Alert Messages */}
                        {alert.alerts.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-border/20">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tín hiệu</p>
                                <div className="flex flex-wrap gap-2">
                                    {alert.alerts.map((msg, i) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                                        >
                                            {msg}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {alert.alerts.length === 0 && (
                            <div className="pt-3 border-t border-border/20">
                                <p className="text-xs text-muted-foreground italic">Không có tín hiệu đặc biệt</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
