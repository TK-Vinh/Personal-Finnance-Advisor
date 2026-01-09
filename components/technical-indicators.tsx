"use client"

interface TechnicalIndicatorsProps {
  symbol: string
  data?: any
}

export default function TechnicalIndicators({ symbol, data }: TechnicalIndicatorsProps) {
  const indicators = data || {
    roe: 22.5,
    pe: 18.4,
    eps: 5200,
    beta: 0.85,
    dividendYield: 2.5,
  }
  return (
    <div className="glass-strong rounded-xl border border-border/20 p-4 h-full flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-foreground text-sm mb-4">Financials & Technicals</h3>
      </div>

      <div className="space-y-4 flex-1">
        {/* ROE */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">ROE</span>
            <span className="text-sm font-bold text-primary">{indicators.roe?.toFixed(2)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(indicators.roe, 100)}%` }} />
          </div>
        </div>

        {/* P/E */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">P/E Ratio</span>
            <span className="text-sm font-bold text-success">{indicators.pe?.toFixed(2)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-success rounded-full" style={{ width: `${Math.min(indicators.pe * 5, 100)}%` }} />
          </div>
        </div>

        {/* EPS */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">EPS (TTM)</span>
            <span className="text-sm font-bold text-foreground">
              {indicators.eps?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-foreground/40 rounded-full" style={{ width: "60%" }} />
          </div>
        </div>

        {/* Beta & Yield Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Beta</span>
            <p className="text-sm font-bold text-foreground">{indicators.beta?.toFixed(2)}</p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Dividend Yield</span>
            <p className="text-sm font-bold text-success">{indicators.dividendYield?.toFixed(2)}%</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/20 mt-4">
        <p className="text-xs text-muted-foreground italic">Source: FireAnt Financial Indicators</p>
      </div>
    </div>
  )
}
