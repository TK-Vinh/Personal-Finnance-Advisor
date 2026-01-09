"use client"

import { useState } from "react"
import Header from "@/components/header"
import Sidebar from "@/components/sidebar"
import ChatInterface from "@/components/chat-interface"
import MarketIntelligence from "@/components/market-intelligence"

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("VN30")

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar selectedSymbol={selectedSymbol} onSymbolChange={setSelectedSymbol} />

        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <ChatInterface selectedSymbol={selectedSymbol} />
          <MarketIntelligence symbol={selectedSymbol} />
        </div>
      </div>
    </div>
  )
}
