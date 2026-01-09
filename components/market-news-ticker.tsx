"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

interface MarketNewsTickerProps {
  data?: any[]
}

const FALLBACK_NEWS = [
  { text: "No recent news found for this symbol.", trend: "flat" },
]

export default function MarketNewsTicker({ data }: MarketNewsTickerProps) {
  const newsItems = data && data.length > 0 ? data : FALLBACK_NEWS

  return (
    <div className="glass-strong rounded-xl border border-border/20 p-4">
      <h3 className="font-semibold text-foreground text-sm mb-3">Market News</h3>
      <div className="space-y-2">
        {newsItems.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <span className="text-muted-foreground text-sm flex-1 line-clamp-2">{item.text}</span>
            {item.trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
            ) : item.trend === "down" ? (
              <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
