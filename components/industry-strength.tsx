"use client"

import { useState, useEffect } from "react"
import { Search, TrendingUp, TrendingDown, Minus, Crown, Loader2 } from "lucide-react"
import { proxyGetSymbolFullData } from "@/app/actions"

interface IndustryStrengthProps {
    symbol: string
}

interface StockData {
    symbol: string
    pe: number
    pb: number
    roe: number
    roa: number
    eps: number
    price: number
    percentChange: number
}

const indicators = [
    { key: "pe", label: "P/E", description: "Giá/Lợi nhuận", higherBetter: false },
    { key: "pb", label: "P/B", description: "Giá/Sổ sách", higherBetter: false },
    { key: "roe", label: "ROE", description: "Tỷ suất sinh lời", higherBetter: true, suffix: "%" },
    { key: "roa", label: "ROA", description: "Lợi nhuận/Tài sản", higherBetter: true, suffix: "%" },
    { key: "eps", label: "EPS", description: "Thu nhập/CP", higherBetter: true, isCurrency: true },
]

export default function IndustryStrength({ symbol }: IndustryStrengthProps) {
    const [symbol1, setSymbol1] = useState(symbol)
    const [symbol2, setSymbol2] = useState("")
    const [search1, setSearch1] = useState("")
    const [search2, setSearch2] = useState("")
    const [searchResults1, setSearchResults1] = useState<any[]>([])
    const [searchResults2, setSearchResults2] = useState<any[]>([])
    const [isSearching1, setIsSearching1] = useState(false)
    const [isSearching2, setIsSearching2] = useState(false)
    const [stock1Data, setStock1Data] = useState<StockData | null>(null)
    const [stock2Data, setStock2Data] = useState<StockData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Update symbol1 when prop changes
    useEffect(() => {
        setSymbol1(symbol)
    }, [symbol])

    // Fetch stock 1 data
    useEffect(() => {
        const fetchData = async () => {
            if (!symbol1) return
            setIsLoading(true)
            try {
                const data = await proxyGetSymbolFullData(symbol1)
                if (data) {
                    setStock1Data({
                        symbol: symbol1,
                        pe: data.technicals?.pe || 0,
                        pb: data.technicals?.pb || 0,
                        roe: data.technicals?.roe || 0,
                        roa: data.technicals?.roa || 0,
                        eps: data.technicals?.eps || 0,
                        price: data.price || 0,
                        percentChange: data.percentChange || 0,
                    })
                }
            } catch (error) {
                console.error("Error fetching stock 1:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [symbol1])

    // Fetch stock 2 data
    useEffect(() => {
        const fetchData = async () => {
            if (!symbol2) {
                setStock2Data(null)
                return
            }
            try {
                const data = await proxyGetSymbolFullData(symbol2)
                if (data) {
                    setStock2Data({
                        symbol: symbol2,
                        pe: data.technicals?.pe || 0,
                        pb: data.technicals?.pb || 0,
                        roe: data.technicals?.roe || 0,
                        roa: data.technicals?.roa || 0,
                        eps: data.technicals?.eps || 0,
                        price: data.price || 0,
                        percentChange: data.percentChange || 0,
                    })
                }
            } catch (error) {
                console.error("Error fetching stock 2:", error)
            }
        }
        fetchData()
    }, [symbol2])

    // Search handlers
    const handleSearch = async (query: string, setResults: (r: any[]) => void, setSearching: (s: boolean) => void) => {
        if (query.length < 2) {
            setResults([])
            return
        }
        setSearching(true)
        try {
            const response = await fetch(`/api/search?keywords=${encodeURIComponent(query)}`)
            const results = await response.json()
            setResults(results)
        } catch (error) {
            setResults([])
        } finally {
            setSearching(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(search1, setSearchResults1, setIsSearching1), 500)
        return () => clearTimeout(timer)
    }, [search1])

    useEffect(() => {
        const timer = setTimeout(() => handleSearch(search2, setSearchResults2, setIsSearching2), 500)
        return () => clearTimeout(timer)
    }, [search2])

    const getWinner = (key: string, higherBetter: boolean): string | null => {
        if (!stock1Data || !stock2Data) return null
        const val1 = stock1Data[key as keyof StockData] as number
        const val2 = stock2Data[key as keyof StockData] as number
        if (val1 === val2) return null
        if (higherBetter) return val1 > val2 ? stock1Data.symbol : stock2Data.symbol
        return val1 < val2 ? stock1Data.symbol : stock2Data.symbol
    }

    const formatValue = (value: number, isCurrency?: boolean, suffix?: string) => {
        if (isCurrency) return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
        return value.toFixed(2) + (suffix || "")
    }

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="glass-strong rounded-xl border border-border/20 p-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    So sánh sức mạnh cổ phiếu
                </h2>
                <p className="text-sm text-muted-foreground">
                    Chọn 2 cổ phiếu để so sánh các chỉ số tài chính và xác định cổ phiếu dẫn đầu
                </p>
            </div>

            {/* Search Bars */}
            <div className="grid grid-cols-2 gap-4">
                {/* Stock 1 Search */}
                <div className="glass-strong rounded-xl border border-border/20 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-primary">Cổ phiếu 1</h3>
                    <div className="relative">
                        <input
                            type="text"
                            value={search1}
                            onChange={(e) => setSearch1(e.target.value)}
                            placeholder={symbol1 || "Tìm cổ phiếu..."}
                            className="w-full bg-input border border-border/30 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        {isSearching1 && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
                        {searchResults1.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full glass-strong border border-border/20 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                {searchResults1.map((r) => (
                                    <div
                                        key={r.symbol}
                                        className="p-2 hover:bg-primary/10 cursor-pointer text-sm"
                                        onClick={() => {
                                            setSymbol1(r.symbol)
                                            setSearch1("")
                                            setSearchResults1([])
                                        }}
                                    >
                                        <span className="font-bold">{r.symbol}</span>
                                        <span className="text-muted-foreground ml-2 text-xs">{r.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {stock1Data && (
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">{stock1Data.symbol}</span>
                            <span className="text-sm text-muted-foreground">
                                {stock1Data.price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Stock 2 Search */}
                <div className="glass-strong rounded-xl border border-border/20 p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-success">Cổ phiếu 2</h3>
                    <div className="relative">
                        <input
                            type="text"
                            value={search2}
                            onChange={(e) => setSearch2(e.target.value)}
                            placeholder="Tìm cổ phiếu để so sánh..."
                            className="w-full bg-input border border-border/30 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-success/50"
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        {isSearching2 && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
                        {searchResults2.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full glass-strong border border-border/20 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                {searchResults2.map((r) => (
                                    <div
                                        key={r.symbol}
                                        className="p-2 hover:bg-success/10 cursor-pointer text-sm"
                                        onClick={() => {
                                            setSymbol2(r.symbol)
                                            setSearch2("")
                                            setSearchResults2([])
                                        }}
                                    >
                                        <span className="font-bold">{r.symbol}</span>
                                        <span className="text-muted-foreground ml-2 text-xs">{r.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {stock2Data && (
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">{stock2Data.symbol}</span>
                            <span className="text-sm text-muted-foreground">
                                {stock2Data.price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Comparison Table */}
            {stock1Data && (
                <div className="glass-strong rounded-xl border border-border/20 p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        📊 Bảng so sánh chỉ số
                    </h3>

                    <div className="space-y-3">
                        {indicators.map((ind) => {
                            const winner = getWinner(ind.key, ind.higherBetter)
                            const val1 = stock1Data[ind.key as keyof StockData] as number
                            const val2 = stock2Data ? (stock2Data[ind.key as keyof StockData] as number) : null

                            return (
                                <div key={ind.key} className="flex items-center gap-4 py-2 border-b border-border/10 last:border-0">
                                    {/* Label */}
                                    <div className="w-24 shrink-0">
                                        <p className="text-sm font-medium text-foreground">{ind.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{ind.description}</p>
                                    </div>

                                    {/* Stock 1 Value */}
                                    <div className={`flex-1 text-center py-2 rounded-lg ${winner === stock1Data.symbol ? "bg-primary/20 border border-primary/30" : "bg-muted/30"}`}>
                                        <div className="flex items-center justify-center gap-2">
                                            {winner === stock1Data.symbol && <Crown className="w-4 h-4 text-primary" />}
                                            <span className={`font-bold ${winner === stock1Data.symbol ? "text-primary" : "text-foreground"}`}>
                                                {formatValue(val1, ind.isCurrency, ind.suffix)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* VS */}
                                    <div className="w-10 text-center text-xs text-muted-foreground font-medium">VS</div>

                                    {/* Stock 2 Value */}
                                    <div className={`flex-1 text-center py-2 rounded-lg ${stock2Data && winner === stock2Data.symbol ? "bg-success/20 border border-success/30" : "bg-muted/30"}`}>
                                        {stock2Data ? (
                                            <div className="flex items-center justify-center gap-2">
                                                {winner === stock2Data.symbol && <Crown className="w-4 h-4 text-success" />}
                                                <span className={`font-bold ${winner === stock2Data.symbol ? "text-success" : "text-foreground"}`}>
                                                    {formatValue(val2!, ind.isCurrency, ind.suffix)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">--</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Summary */}
                    {stock2Data && (
                        <div className="mt-4 pt-4 border-t border-border/20">
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Số chỉ số dẫn đầu</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary font-bold text-lg">{stock1Data.symbol}</span>
                                            <span className="text-2xl font-bold text-primary">
                                                {indicators.filter(i => getWinner(i.key, i.higherBetter) === stock1Data.symbol).length}
                                            </span>
                                        </div>
                                        <span className="text-muted-foreground">-</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-success">
                                                {indicators.filter(i => getWinner(i.key, i.higherBetter) === stock2Data.symbol).length}
                                            </span>
                                            <span className="text-success font-bold text-lg">{stock2Data.symbol}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}
        </div>
    )
}
