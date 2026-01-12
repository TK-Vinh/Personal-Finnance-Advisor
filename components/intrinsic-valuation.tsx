"use client"

import { useState, useEffect } from "react"
import { Calculator, TrendingUp, TrendingDown, Shield, AlertCircle, Loader2 } from "lucide-react"
import { proxyGetSymbolFullData } from "@/app/actions"

interface IntrinsicValuationProps {
    symbol: string
}

interface ValuationMethod {
    name: string
    price: number | null
    weight?: number
    description: string
}

export default function IntrinsicValuation({ symbol }: IntrinsicValuationProps) {
    const [currentPrice, setCurrentPrice] = useState(0)
    const [valuationMethods, setValuationMethods] = useState<ValuationMethod[]>([])
    const [consensusPrice, setConsensusPrice] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            if (!symbol) return
            setIsLoading(true)
            try {
                const data = await proxyGetSymbolFullData(symbol)
                if (data) {
                    setCurrentPrice(data.price || 0)

                    // Get valuation data from prediction
                    if (data.prediction) {
                        setConsensusPrice(data.prediction.consensusPrice || null)

                        // Map valuation methods
                        const methods: ValuationMethod[] = [
                            {
                                name: "DCF",
                                price: data.prediction.rawData?.estimatedPriceDCF || null,
                                description: "Chiết khấu dòng tiền"
                            },
                            {
                                name: "P/E Mục tiêu",
                                price: data.prediction.rawData?.estimatedPricePE || null,
                                description: "Định giá theo P/E ngành"
                            },
                            {
                                name: "P/B",
                                price: data.prediction.rawData?.estimatedPricePB || null,
                                description: "Định giá theo giá sổ sách"
                            },
                            {
                                name: "Graham #1",
                                price: data.prediction.rawData?.estimatedPriceGraham1 || null,
                                description: "Công thức Graham cơ bản"
                            },
                            {
                                name: "Graham #2",
                                price: data.prediction.rawData?.estimatedPriceGraham2 || null,
                                description: "Graham với tăng trưởng"
                            },
                            {
                                name: "Graham #3",
                                price: data.prediction.rawData?.estimatedPriceGraham3 || null,
                                description: "Graham bảo thủ"
                            },
                        ].filter(m => m.price && m.price > 0)

                        setValuationMethods(methods)
                    }
                }
            } catch (error) {
                console.error("Error fetching valuation:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [symbol])

    const calculateSafetyMargin = (targetPrice: number) => {
        if (!currentPrice || !targetPrice) return 0
        return ((targetPrice - currentPrice) / currentPrice) * 100
    }

    const getSafetyColor = (margin: number) => {
        if (margin > 30) return "text-success"
        if (margin > 10) return "text-warning"
        if (margin > 0) return "text-orange-500"
        return "text-destructive"
    }

    const getSafetyLabel = (margin: number) => {
        if (margin > 30) return "Rất an toàn"
        if (margin > 10) return "An toàn"
        if (margin > 0) return "Biên an toàn thấp"
        return "Định giá cao"
    }

    const avgValuation = valuationMethods.length > 0
        ? valuationMethods.reduce((sum, m) => sum + (m.price || 0), 0) / valuationMethods.length
        : null

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="glass-strong rounded-xl border border-border/20 p-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Định giá nội tại - {symbol}
                </h2>
                <p className="text-sm text-muted-foreground">
                    Tính giá hợp lý theo nhiều phương pháp định giá và xác định biên an toàn
                </p>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && (
                <>
                    {/* Current Price vs Target */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Current Price */}
                        <div className="glass-strong rounded-xl border border-border/20 p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Giá hiện tại</p>
                            <p className="text-2xl font-bold text-foreground">
                                {currentPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                            </p>
                        </div>

                        {/* Consensus Price */}
                        <div className="glass-strong rounded-xl border border-border/20 p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Giá mục tiêu (Consensus)</p>
                            {consensusPrice ? (
                                <>
                                    <p className="text-2xl font-bold text-primary">
                                        {consensusPrice.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {consensusPrice > currentPrice ? (
                                            <TrendingUp className="w-4 h-4 text-success" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-destructive" />
                                        )}
                                        <span className={consensusPrice > currentPrice ? "text-success text-sm" : "text-destructive text-sm"}>
                                            {((consensusPrice - currentPrice) / currentPrice * 100).toFixed(1)}% so với giá hiện tại
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground">Không có dữ liệu</p>
                            )}
                        </div>
                    </div>

                    {/* Safety Margin Summary */}
                    {avgValuation && (
                        <div className="glass-strong rounded-xl border border-border/20 p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Shield className={`w-8 h-8 ${getSafetyColor(calculateSafetyMargin(avgValuation))}`} />
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Biên an toàn trung bình</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-2xl font-bold ${getSafetyColor(calculateSafetyMargin(avgValuation))}`}>
                                            {calculateSafetyMargin(avgValuation).toFixed(1)}%
                                        </span>
                                        <span className={`text-sm px-2 py-0.5 rounded-full ${getSafetyColor(calculateSafetyMargin(avgValuation))} bg-current/10`}>
                                            {getSafetyLabel(calculateSafetyMargin(avgValuation))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Safety Margin Bar */}
                            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-destructive via-warning to-success rounded-full"
                                    style={{ width: '100%' }}
                                />
                                <div
                                    className="absolute top-0 h-full w-1 bg-foreground"
                                    style={{ left: `${Math.min(Math.max((calculateSafetyMargin(avgValuation) + 50) / 100 * 100, 0), 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                                <span>-50%</span>
                                <span>0%</span>
                                <span>+50%</span>
                            </div>
                        </div>
                    )}

                    {/* Valuation Methods */}
                    <div className="glass-strong rounded-xl border border-border/20 p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            📊 Các phương pháp định giá
                        </h3>

                        {valuationMethods.length === 0 && (
                            <div className="text-center py-4">
                                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Không có dữ liệu định giá cho mã này</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {valuationMethods.map((method) => {
                                const safetyMargin = calculateSafetyMargin(method.price || 0)

                                return (
                                    <div key={method.name} className="flex items-center gap-4 py-3 border-b border-border/10 last:border-0">
                                        {/* Method Name */}
                                        <div className="w-32 shrink-0">
                                            <p className="font-medium text-foreground">{method.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{method.description}</p>
                                        </div>

                                        {/* Target Price */}
                                        <div className="flex-1">
                                            <p className="text-lg font-bold text-primary">
                                                {method.price?.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                                            </p>
                                        </div>

                                        {/* Safety Margin */}
                                        <div className="w-32 text-right">
                                            <p className={`text-lg font-bold ${getSafetyColor(safetyMargin)}`}>
                                                {safetyMargin > 0 ? "+" : ""}{safetyMargin.toFixed(1)}%
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">Biên an toàn</p>
                                        </div>

                                        {/* Visual Indicator */}
                                        <div className="w-16 shrink-0">
                                            {safetyMargin > 10 ? (
                                                <div className="flex items-center gap-1 text-success">
                                                    <TrendingUp className="w-5 h-5" />
                                                    <span className="text-xs font-medium">Hấp dẫn</span>
                                                </div>
                                            ) : safetyMargin < -10 ? (
                                                <div className="flex items-center gap-1 text-destructive">
                                                    <TrendingDown className="w-5 h-5" />
                                                    <span className="text-xs font-medium">Đắt</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-warning">
                                                    <span className="text-xs font-medium">Hợp lý</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="glass-strong rounded-xl border border-border/20 p-4 bg-primary/5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-foreground font-medium mb-1">Lưu ý quan trọng</p>
                                <p className="text-xs text-muted-foreground">
                                    Biên an toàn (Margin of Safety) là khoảng cách giữa giá mục tiêu và giá hiện tại.
                                    Theo nguyên tắc đầu tư giá trị, bạn nên mua khi biên an toàn {">"}30% để giảm thiểu rủi ro.
                                    Các phương pháp định giá chỉ mang tính tham khảo.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
