"use client"

interface OrderBookProps {
  symbol: string
  data?: any[]
}

const ORDER_DATA = [
  { price: 1297.5, quantity: 450, side: "ask" },
  { price: 1296.8, quantity: 320, side: "ask" },
  { price: 1296.0, quantity: 680, side: "ask" },
  { price: 1295.3, quantity: 1200, side: "mid" },
  { price: 1294.5, quantity: 890, side: "bid" },
  { price: 1293.8, quantity: 550, side: "bid" },
  { price: 1292.2, quantity: 420, side: "bid" },
]

export default function OrderBook({ symbol, data }: OrderBookProps) {
  const orders = data && data.length > 0 ? data : [
    { price: 129700, quantity: 450, side: "ask" },
    { price: 129600, quantity: 320, side: "ask" },
    { price: 129500, quantity: 1200, side: "mid" },
    { price: 129400, quantity: 890, side: "bid" },
  ]

  return (
    <div className="glass-strong rounded-xl border border-border/20 p-4 h-full flex flex-col overflow-hidden">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground text-sm">Sổ lệnh Trực tiếp</h3>
        <p className="text-xs text-muted-foreground">{symbol} Mua/Bán</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {orders.map((order: any, i: number) => (
          <div
            key={i}
            className={`flex justify-between items-center p-2 rounded text-xs ${order.side === "ask" ? "bg-destructive/10" : order.side === "bid" ? "bg-success/10" : "bg-muted/20"
              }`}
          >
            <span className="font-mono text-muted-foreground">
              {order.price.toLocaleString("vi-VN")}
            </span>
            <span
              className={`font-mono font-bold ${order.side === "ask" ? "text-destructive" : order.side === "bid" ? "text-success" : "text-foreground"
                }`}
            >
              {order.quantity || order.volume}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
