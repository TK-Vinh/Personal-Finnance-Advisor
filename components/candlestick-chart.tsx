"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CandlestickChartProps {
  symbol: string
  data?: any[]
}

export default function CandlestickChart({ symbol, data }: CandlestickChartProps) {
  const chartData = data && data.length > 0 ? data : [
    { time: "01/01", price: 1270 },
    { time: "02/01", price: 1275 },
    { time: "03/01", price: 1272 },
    { time: "04/01", price: 1285 },
  ]

  return (
    <div className="glass-strong rounded-xl border border-border/20 p-4 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground text-sm">{symbol} Price Chart</h3>
        <p className="text-xs text-muted-foreground">30-Day Historical Data</p>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: "10px" }}
            interval="preserveStartEnd"
          />
          <YAxis
            hide
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(20,20,30,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="oklch(0.6 0.2 35)"
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
