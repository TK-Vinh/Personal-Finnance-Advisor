"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Star, TrendingUp, Bell, Search, X, Loader2, LogIn, LogOut, User } from "lucide-react"
import { MarketData } from "@/lib/fireant"
import { proxyGetSymbolQuote } from "@/app/actions"
import { useSession, signOut } from "next-auth/react"
import { getWatchlist, addToWatchlist, removeFromWatchlist } from "@/app/actions/user"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
}

export default function Sidebar({ selectedSymbol, onSymbolChange }: SidebarProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pinnedSymbols, setPinnedSymbols] = useState<MarketData[]>([])
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
        setPinnedSymbols(quotes)
      }
    }
    loadWatchlist()
  }, [session])

  // Update debounced search query after 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const togglePin = async (symbolData: any) => {
    const isPinned = pinnedSymbols.some((s: MarketData) => s.symbol === symbolData.symbol)
    if (isPinned) {
      setPinnedSymbols((prev: MarketData[]) => prev.filter((s: MarketData) => s.symbol !== symbolData.symbol))
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

      setPinnedSymbols((prev: MarketData[]) => [...prev, newQuote])
      if (session?.user?.id) {
        await addToWatchlist(symbolData.symbol)
      }
    }
    setSearchQuery("")
    setSearchResults([])
  }

  return (
    <aside className="w-80 border-r border-border/20 glass p-4 overflow-y-auto hidden lg:flex flex-col gap-6">
      {/* Search Section */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">🔍 Search Stock</h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search symbol or company..."
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

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 flex justify-between items-center">
          📌 Pinned Symbols
          <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded text-primary">{pinnedSymbols.length}</span>
        </h2>
        <div className="space-y-2">
          {pinnedSymbols.map((item: MarketData) => (
            <button
              key={item.symbol}
              onClick={() => onSymbolChange(item.symbol)}
              className={`w-full p-3 rounded-lg border transition-all relative group ${selectedSymbol === item.symbol
                ? "glass-strong border-primary/50 bg-primary/10"
                : "border-border/10 hover:border-primary/20"
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">{item.symbol}</span>
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
                <Star className={`w-4 h-4 ${pinnedSymbols.some((s: MarketData) => s.symbol === item.symbol) ? "fill-primary text-primary" : ""} group-hover:hidden`} />
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
            <p className="text-center text-xs text-muted-foreground py-4 italic">No symbols pinned. Search to add some!</p>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-4 border-t border-border/10">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Account</h3>
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
              title="Logout"
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
            Sign In to Sync
          </button>
        )}

        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Quick Actions</h3>
        <button className="w-full p-2.5 rounded-lg glass-strong border border-border/10 text-sm font-medium text-foreground hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
          <Bell className="w-4 h-4" />
          Price Alerts
        </button>
        <button className="w-full p-2.5 rounded-lg glass-strong border border-border/10 text-sm font-medium text-foreground hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Market Trends
        </button>
      </div>
    </aside >
  )
}
