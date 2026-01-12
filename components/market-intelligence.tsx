"use client"
import CandlestickChart from "./candlestick-chart"
import PredictionGauge from "./prediction-gauge"
import OrderBook from "./order-book"
import TechnicalIndicators from "./technical-indicators"
import MarketNewsTicker from "./market-news-ticker"
import SummaryCard from "./summary-card"
import UserNotes from "./user-notes"
import { useEffect, useState } from "react"
import { proxyGetSymbolFullData } from "@/app/actions"

interface MarketIntelligenceProps {
  symbol: string
}

export default function MarketIntelligence({ symbol }: MarketIntelligenceProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const fullData = await proxyGetSymbolFullData(symbol)
      setData(fullData)
      setIsLoading(false)
    }
    fetchData()
  }, [symbol])

  return (
    <div className="flex-1 flex flex-col min-w-0 gap-4 overflow-y-auto max-w-2xl">
      {/* Top Row */}
      <div className="grid grid-cols-2 gap-4 shrink-0">
        <CandlestickChart symbol={symbol} data={data?.history} />
        <PredictionGauge symbol={symbol} currentPrice={data?.price} data={data?.prediction} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-2 gap-4 shrink-0 h-80">
        <OrderBook symbol={symbol} data={data?.orderBook} />
        <UserNotes symbol={symbol} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4 shrink-0">
        <TechnicalIndicators symbol={symbol} data={data?.technicals} />
        <div className="space-y-4">
          <SummaryCard symbol={symbol} data={data} />
          <MarketNewsTicker data={data?.news} />
        </div>
      </div>
    </div>
  )
}
