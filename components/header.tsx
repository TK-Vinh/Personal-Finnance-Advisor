"use client"

import { Zap } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b border-border/20 glass sticky top-0 z-50 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">FireAnt</h1>
            <p className="text-xs text-muted-foreground">AI Trading Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full bg-success/10 border border-success/30 text-xs text-success font-medium">
            🟢 Live Market
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
            AI
          </div>
        </div>
      </div>
    </header>
  )
}
