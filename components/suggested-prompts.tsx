"use client"

import { Zap, TrendingUp, BarChart3 } from "lucide-react"

const PROMPTS = [
  { icon: TrendingUp, text: "Analyze HPG Stock", color: "primary" },
  { icon: BarChart3, text: "Predict VNINDEX tomorrow", color: "primary" },
  { icon: Zap, text: "Compare Bank Sector", color: "primary" },
]

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void
}

export default function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome to FireAnt AI</h2>
        <p className="text-muted-foreground">Get instant market analysis and predictions</p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
        {PROMPTS.map((prompt, i) => {
          const Icon = prompt.icon
          return (
            <button
              key={i}
              onClick={() => onSelectPrompt(prompt.text)}
              className="flex items-center gap-3 p-4 rounded-lg glass-strong border border-border/20 hover:border-primary/40 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                {prompt.text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
