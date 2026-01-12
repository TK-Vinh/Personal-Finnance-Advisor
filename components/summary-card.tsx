"use client"

import { Sparkles, Save, Check } from "lucide-react"
import { useSession } from "next-auth/react"
import { saveNote } from "@/app/actions/user"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface SummaryCardProps {
  symbol: string
  data?: any
}

export default function SummaryCard({ symbol, data }: SummaryCardProps) {
  const name = data?.name || symbol
  const rsi = data?.technicals?.rsi || 50
  const trend = data?.trend || "flat"

  const { data: session } = useSession()
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const getTrendText = (t: string) => {
    if (t === "up") return "tăng"
    if (t === "down") return "giảm"
    return "đi ngang"
  }

  const getAnalysis = () => {
    if (!data) return "Chọn một mã cổ phiếu để xem phân tích thị trường và tổng quan hiệu suất do AI cung cấp."

    let analysis = `${name} (${symbol}) đang giao dịch với xu hướng ${getTrendText(trend)}. `
    if (data.technicals?.pe) {
      analysis += `Cổ phiếu có tỷ lệ P/E là ${data.technicals.pe.toFixed(2)}, `
    }
    if (data.technicals?.roe) {
      analysis += `và ROE đạt ${data.technicals.roe.toFixed(2)}%. `
    }
    analysis += `Chỉ số kỹ thuật cho thấy RSI ở mức ${rsi}, cho thấy thị trường đang ${rsi > 70 ? "quá mua" : rsi < 30 ? "quá bán" : "trung lập"}. `

    if (data.technicals?.beta) {
      analysis += `Với Beta ${data.technicals.beta.toFixed(2)}, cổ phiếu có độ biến động ${data.technicals.beta > 1 ? "cao hơn" : "thấp hơn"} so với thị trường. `
    }
    if (data.technicals?.dividendYield) {
      analysis += `Tỷ suất cổ tức đạt ${data.technicals.dividendYield.toFixed(2)}%.`
    }

    return analysis
  }

  const handleSaveInsight = async () => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để lưu phân tích.")
      return
    }

    setIsSaving(true)
    try {
      await saveNote(`Phân tích: ${symbol}`, getAnalysis(), symbol)
      setIsSaved(true)
      toast.success("Đã lưu phân tích vào ghi chú!")
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      toast.error("Không thể lưu phân tích.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="glass-strong rounded-xl border border-border/20 p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/20 flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Tổng quan & Phân tích</h3>
            {data && (
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving || isSaved || !session}
                onClick={handleSaveInsight}
                className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:bg-primary/10"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3 h-3" />
                    Đã lưu
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    Lưu phân tích
                  </>
                )}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getAnalysis()}
          </p>
        </div>
      </div>
    </div>
  )
}
