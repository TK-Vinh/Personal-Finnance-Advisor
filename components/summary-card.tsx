"use client"

import { Sparkles } from "lucide-react"

interface SummaryCardProps {
  symbol: string
  data?: any
}

export default function SummaryCard({ symbol, data }: SummaryCardProps) {
  const name = data?.name || symbol
  const rsi = data?.technicals?.rsi || 50
  const trend = data?.trend || "flat"

  const getAnalysis = () => {
    if (!data) return "Select a symbol to view AI-driven market analysis and performance summary."

    let analysis = `${name} (${symbol}) is currently trading with a ${trend} trend. `
    if (data.technicals?.pe) {
      analysis += `The stock has a P/E ratio of ${data.technicals.pe.toFixed(2)}, `
    }
    if (data.technicals?.roe) {
      analysis += `and showing a ROE of ${data.technicals.roe.toFixed(2)}%. `
    }
    analysis += `Technical indicators suggest an RSI of ${rsi}, indicating ${rsi > 70 ? "overbought" : rsi < 30 ? "oversold" : "neutral"} conditions. `

    if (data.technicals?.beta) {
      analysis += `With a Beta of ${data.technicals.beta.toFixed(2)}, the stock shows ${data.technicals.beta > 1 ? "higher" : "lower"} volatility compared to the market. `
    }
    if (data.technicals?.dividendYield) {
      analysis += `It offers a dividend yield of ${data.technicals.dividendYield.toFixed(2)}%.`
    }

    return analysis
  }

  return (
    <div className="glass-strong rounded-xl border border-border/20 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/20 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-2">Symbol Overview & Insights</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getAnalysis()}
          </p>
        </div>
      </div>
    </div>
  )
}
