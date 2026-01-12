"use client"

import { useState } from "react"
import Header from "@/components/header"
import AppSidebar, { TabType } from "@/components/app-sidebar"
import ChatWithSessions from "@/components/chat-with-sessions"
import MarketIntelligence from "@/components/market-intelligence"
import IndustryStrength from "@/components/industry-strength"
import TechnicalAlerts from "@/components/technical-alerts"
import IntrinsicValuation from "@/components/intrinsic-valuation"
import { MarketData } from "@/lib/fireant"

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("VN30")
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [pinnedSymbols, setPinnedSymbols] = useState<MarketData[]>([])

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            <ChatWithSessions selectedSymbol={selectedSymbol} />
            <MarketIntelligence symbol={selectedSymbol} />
          </>
        )
      case "industry":
        return (
          <div className="flex-1 overflow-hidden">
            <IndustryStrength symbol={selectedSymbol} />
          </div>
        )
      case "technical":
        return (
          <div className="flex-1 overflow-hidden">
            <TechnicalAlerts pinnedSymbols={pinnedSymbols} />
          </div>
        )
      case "valuation":
        return (
          <div className="flex-1 overflow-hidden">
            <IntrinsicValuation symbol={selectedSymbol} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          selectedSymbol={selectedSymbol}
          onSymbolChange={setSelectedSymbol}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pinnedSymbols={pinnedSymbols}
          onPinnedSymbolsChange={setPinnedSymbols}
        />

        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
