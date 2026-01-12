"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    LayoutDashboard,
    TrendingUp,
    AlertTriangle,
    Calculator,
    Star,
    Search,
    X,
    Loader2,
    LogIn,
    LogOut,
    User,
    ChevronRight
} from "lucide-react"
import { MarketData } from "@/lib/fireant"
import { proxyGetSymbolQuote } from "@/app/actions"
import { useSession, signOut } from "next-auth/react"
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "@/app/actions/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type TabType = "overview" | "industry" | "technical" | "valuation"

interface AppSidebarProps {
    selectedSymbol: string
    onSymbolChange: (symbol: string) => void
    activeTab: TabType
    onTabChange: (tab: TabType) => void
    pinnedSymbols: MarketData[]
    onPinnedSymbolsChange: (symbols: MarketData[]) => void
}

const navItems = [
    {
        id: "overview" as TabType,
        label: "Tổng quan mã",
        icon: LayoutDashboard,
        description: "Dashboard phân tích"
    },
    {
        id: "industry" as TabType,
        label: "Sức mạnh ngành",
        icon: TrendingUp,
        description: "So sánh đối thủ"
    },
    {
        id: "technical" as TabType,
        label: "Cảnh báo kỹ thuật",
        icon: AlertTriangle,
        description: "Tín hiệu RSI, MACD"
    },
    {
        id: "valuation" as TabType,
        label: "Định giá nội tại",
        icon: Calculator,
        description: "DCF, P/E, Graham"
    },
]

export default function AppSidebar({
    selectedSymbol,
    onSymbolChange,
    activeTab,
    onTabChange,
    pinnedSymbols,
    onPinnedSymbolsChange
}: AppSidebarProps) {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Load watchlist on mount if logged in
    useEffect(() => {
        const loadWatchlist = async () => {
            if (session?.user?.id) {
                const symbols = await getWatchlist()
                const quotes = await Promise.all(
                    symbols.map(async (s) => {
                        const quote = await proxyGetSymbolQuote(s)
                        return quote || { symbol: s, price: 0, change: 0, percentChange: 0, trend: "flat" } as MarketData
                    })
                )
                onPinnedSymbolsChange(quotes)
            }
        }
        loadWatchlist()
    }, [session])

    // Update debounced search query after 500ms
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 500)
        return () => clearTimeout(handler)
    }, [searchQuery])

    // Trigger search when debounced query changes
    useEffect(() => {
        const performSearch = async () => {
            if (debouncedSearchQuery.length < 2) {
                setSearchResults([])
                return
            }
            setIsSearching(true)
            try {
                const response = await fetch(`/api/search?keywords=${encodeURIComponent(debouncedSearchQuery)}`)
                const results = await response.json()
                setSearchResults(results)
            } catch (error) {
                console.error("Failed to fetch search results:", error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }
        performSearch()
    }, [debouncedSearchQuery])

    const togglePin = async (symbolData: any) => {
        const isPinned = pinnedSymbols.some((s: MarketData) => s.symbol === symbolData.symbol)
        if (isPinned) {
            onPinnedSymbolsChange(pinnedSymbols.filter((s: MarketData) => s.symbol !== symbolData.symbol))
            if (session?.user?.id) {
                await removeFromWatchlist(symbolData.symbol)
            }
        } else {
            const quote = await proxyGetSymbolQuote(symbolData.symbol)
            const newQuote = quote || {
                symbol: symbolData.symbol,
                price: 0,
                change: 0,
                percentChange: 0,
                trend: "flat"
            } as MarketData
            onPinnedSymbolsChange([...pinnedSymbols, newQuote])
            if (session?.user?.id) {
                await addToWatchlist(symbolData.symbol)
            }
        }
        setSearchQuery("")
        setSearchResults([])
    }

    return (
        <aside className="w-80 border-r border-border/20 glass p-4 overflow-y-auto hidden lg:flex flex-col gap-4">
            {/* Navigation Tabs */}
            <div className="space-y-1">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                    📊 Phân tích
                </h2>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
                            activeTab === item.id
                                ? "bg-primary/15 border border-primary/30 text-primary"
                                : "hover:bg-primary/5 border border-transparent text-foreground/80 hover:text-foreground"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 shrink-0",
                            activeTab === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.description}</p>
                        </div>
                        <ChevronRight className={cn(
                            "w-4 h-4 transition-transform",
                            activeTab === item.id ? "text-primary" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                        )} />
                    </button>
                ))}
            </div>

            {/* Divider */}
            <div className="border-t border-border/20" />

            {/* Search Section */}
            <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">🔍 Tìm cổ phiếu</h2>
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nhập mã hoặc tên công ty..."
                        className="w-full bg-input border border-border/30 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    {isSearching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground animate-spin" />}
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-[288px] glass-strong border border-border/20 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        {searchResults.map((result: any) => (
                            <div
                                key={result.symbol}
                                className="flex items-center justify-between p-3 hover:bg-primary/10 transition-colors border-b border-border/10 last:border-0 cursor-pointer"
                                onClick={() => {
                                    onSymbolChange(result.symbol)
                                    setSearchQuery("")
                                    setSearchResults([])
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-foreground">{result.symbol}</span>
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{result.name}</span>
                                </div>
                                <div
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        togglePin(result)
                                    }}
                                    className="p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                >
                                    <Star className={`w-4 h-4 ${pinnedSymbols.some((s: MarketData) => s.symbol === result.symbol) ? "fill-primary text-primary" : ""}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pinned Symbols */}
            <div className="space-y-2 flex-1">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 flex justify-between items-center">
                    📌 Cổ phiếu đã ghim
                    <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary">{pinnedSymbols.length}</span>
                </h2>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                    {pinnedSymbols.map((item: MarketData) => (
                        <button
                            key={item.symbol}
                            onClick={() => onSymbolChange(item.symbol)}
                            className={cn(
                                "w-full p-2.5 rounded-lg border transition-all relative group",
                                selectedSymbol === item.symbol
                                    ? "glass-strong border-primary/50 bg-primary/10"
                                    : "border-border/10 hover:border-primary/20"
                            )}
                        >
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="font-semibold text-foreground text-sm">{item.symbol}</span>
                                <div
                                    role="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        togglePin(item)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all cursor-pointer"
                                >
                                    <X className="w-3 h-3 text-destructive" />
                                </div>
                                <Star className={`w-3.5 h-3.5 ${pinnedSymbols.some((s: MarketData) => s.symbol === item.symbol) ? "fill-primary text-primary" : ""} group-hover:hidden`} />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-mono">
                                    {item.price.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                </span>
                                <span className={item.trend === "up" ? "text-success font-medium" : item.trend === "down" ? "text-destructive font-medium" : "text-muted-foreground"}>
                                    {item.trend === "up" ? "▲" : item.trend === "down" ? "▼" : ""}
                                    {Math.abs(item.percentChange)}%
                                </span>
                            </div>
                        </button>
                    ))}
                    {pinnedSymbols.length === 0 && (
                        <p className="text-center text-xs text-muted-foreground py-4 italic">Chưa có cổ phiếu nào. Tìm kiếm để thêm!</p>
                    )}
                </div>
            </div>

            {/* Account Section */}
            <div className="mt-auto space-y-3 pt-4 border-t border-border/10">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Tài khoản</h3>
                {status === "loading" ? (
                    <div className="px-2 mb-4">
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="h-9 w-9 rounded-full bg-primary/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-primary/10 rounded w-20" />
                                <div className="h-2 bg-primary/10 rounded w-32" />
                            </div>
                        </div>
                    </div>
                ) : session ? (
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <Avatar className="h-9 w-9 border border-primary/20">
                            <AvatarImage src={session.user?.image || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {session.user?.name?.[0] || <User className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{session.user?.name || "User"}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{session.user?.email}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Đăng xuất"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => router.push("/login")}
                        className="w-full p-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-4 h-4" />
                        Đăng nhập để đồng bộ
                    </button>
                )}
            </div>
        </aside>
    )
}
