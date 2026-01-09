"use client"

interface PredictionGaugeProps {
  symbol: string
  currentPrice?: number
  data?: {
    consensusPrice: number
    valuationMethods: { name: string, price: number, weight: number }[]
  }
}

export default function PredictionGauge({ symbol, currentPrice, data }: PredictionGaugeProps) {
  // If we have real data, calculate probability based on price vs consensus
  // Simple heuristic: if consensus > current, it's bullish
  const price = currentPrice || 0
  const consensus = data?.consensusPrice || 0

  let bullishProbability = 50
  if (price > 0 && consensus > 0) {
    const upside = (consensus - price) / price
    // Map -20% to +20% upside to 0-100% probability
    bullishProbability = Math.min(Math.max(upside * 250 + 50, 10), 90)
  }

  const bearishProbability = 100 - bullishProbability

  return (
    <div className="glass-strong rounded-xl border border-border/20 p-4 h-full flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-foreground text-sm mb-4">Valuation Gauge</h3>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* Upside Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-success">Bullish (Target ${consensus.toLocaleString("vi-VN")})</span>
            <span className="text-sm font-bold text-success">{Math.round(bullishProbability)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success to-success/60 rounded-full"
              style={{ width: `${bullishProbability}%` }}
            />
          </div>
        </div>

        {/* Downside/Current */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-destructive">Bearish</span>
            <span className="text-sm font-bold text-destructive">{Math.round(bearishProbability)}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-destructive to-destructive/60 rounded-full"
              style={{ width: `${bearishProbability}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/20 mt-4">
        <p className="text-xs text-muted-foreground">Based on DCF, P/E, and P/B Valuation Methods</p>
      </div>
    </div>
  )
}
