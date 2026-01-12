"use client"

import { useState, useEffect, useRef } from "react"
import { createChart, ColorType, CrosshairMode, Time } from "lightweight-charts"
import type { IChartApi, CandlestickData, LineData, HistogramData } from "lightweight-charts"
import { proxyGetHistoricalQuotes, proxyGetIntradayQuotes } from "@/app/actions"

interface CandlestickChartProps {
  symbol: string
  data?: any[]
}

type TimeRange = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y"

const timeRangeConfig: Record<TimeRange, { days: number; label: string; isIntraday?: boolean; resolution?: string }> = {
  "1D": { days: 1, label: "1 Ngày", isIntraday: true, resolution: "15" },
  "1W": { days: 7, label: "1 Tuần" },
  "1M": { days: 30, label: "1 Tháng" },
  "3M": { days: 90, label: "3 Tháng" },
  "6M": { days: 180, label: "6 Tháng" },
  "1Y": { days: 365, label: "1 Năm" },
  "3Y": { days: 365 * 3, label: "3 Năm" },
  "5Y": { days: 365 * 5, label: "5 Năm" },
}

interface OHLCVData {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface LegendData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma10: number | null
  ma50: number | null
}

// Calculate Simple Moving Average
function calculateSMA(data: OHLCVData[], period: number): LineData[] {
  const result: LineData[] = []

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    result.push({
      time: data[i].time,
      value: sum / period
    })
  }

  return result
}

export default function CandlestickChart({ symbol, data }: CandlestickChartProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("3M")
  const [chartData, setChartData] = useState<OHLCVData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [legendData, setLegendData] = useState<LegendData | null>(null)

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  // Fetch data based on time range
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const config = timeRangeConfig[selectedRange]
        let historyData: any[] = []

        if (config.isIntraday && config.resolution) {
          // Use intraday API for 1D timeframe
          historyData = await proxyGetIntradayQuotes(symbol, config.resolution)
        } else {
          // Use historical quotes for other timeframes
          const end = new Date()
          const start = new Date()
          start.setDate(end.getDate() - config.days)
          const startDateStr = start.toISOString()
          const endDateStr = end.toISOString()
          historyData = await proxyGetHistoricalQuotes(symbol, startDateStr, endDateStr)
        }

        if (historyData && historyData.length > 0) {
          const processed: OHLCVData[] = historyData.map((d: any) => {
            // Parse timestamp - intraday data has Unix timestamp directly
            let timestamp: number
            if (d.timestamp) {
              // Intraday API returns Unix timestamp directly
              timestamp = d.timestamp
            } else if (d.date) {
              timestamp = new Date(d.date).getTime() / 1000
            } else if (d.time && d.time.includes('/')) {
              const [day, month] = d.time.split('/')
              const year = new Date().getFullYear()
              timestamp = new Date(year, parseInt(month) - 1, parseInt(day)).getTime() / 1000
            } else {
              timestamp = Date.now() / 1000
            }

            return {
              time: timestamp as Time,
              open: d.open || d.price || 0,
              high: d.high || d.price || 0,
              low: d.low || d.price || 0,
              close: d.close || d.price || 0,
              volume: d.volume || Math.floor(Math.random() * 500000) + 100000,
            }
          })

          // Sort by time ascending and remove duplicates
          processed.sort((a, b) => (a.time as number) - (b.time as number))
          const unique = processed.filter((item, index, self) =>
            index === self.findIndex(t => t.time === item.time)
          )
          setChartData(unique)
        } else {
          setChartData([])
        }
      } catch (error) {
        console.error("Error fetching historical data:", error)
        setChartData([])
      } finally {
        setIsLoading(false)
      }
    }

    if (symbol) {
      fetchData()
    }
  }, [symbol, selectedRange])

  // Initialize and update chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const container = chartContainerRef.current

    // Create chart
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.6)',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(100, 100, 100, 0.15)' },
        horzLines: { color: 'rgba(100, 100, 100, 0.15)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: 'rgba(50, 50, 70, 0.9)',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: 'rgba(50, 50, 70, 0.9)',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(100, 100, 100, 0.3)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: 'rgba(100, 100, 100, 0.3)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      autoSize: true,
    })

    chartRef.current = chart

    // Add Candlestick series using the correct v5 API
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })

    // Add Volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    })

    // Add MA10 series
    const ma10Series = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    // Add MA50 series
    const ma50Series = chart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    // Set candlestick data
    const candleData: CandlestickData[] = chartData.map(d => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))
    candlestickSeries.setData(candleData)

    // Set volume data
    const volumeData: HistogramData[] = chartData.map(d => ({
      time: d.time,
      value: d.volume || 0,
      color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }))
    volumeSeries.setData(volumeData)

    // Calculate and set MA data
    const ma10Data = calculateSMA(chartData, 10)
    const ma50Data = calculateSMA(chartData, 50)

    if (ma10Data.length > 0) ma10Series.setData(ma10Data)
    if (ma50Data.length > 0) ma50Series.setData(ma50Data)

    // Create MA lookup maps
    const ma10Map = new Map(ma10Data.map(d => [d.time, d.value]))
    const ma50Map = new Map(ma50Data.map(d => [d.time, d.value]))

    // Show initial legend data
    const lastData = chartData[chartData.length - 1]
    if (lastData) {
      const date = new Date((lastData.time as number) * 1000)
      setLegendData({
        time: date.toLocaleDateString('vi-VN'),
        open: lastData.open,
        high: lastData.high,
        low: lastData.low,
        close: lastData.close,
        volume: lastData.volume || 0,
        ma10: ma10Map.get(lastData.time) || null,
        ma50: ma50Map.get(lastData.time) || null,
      })
    }

    // Crosshair move handler for legend
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        // Show latest data when not hovering
        if (lastData) {
          const date = new Date((lastData.time as number) * 1000)
          setLegendData({
            time: date.toLocaleDateString('vi-VN'),
            open: lastData.open,
            high: lastData.high,
            low: lastData.low,
            close: lastData.close,
            volume: lastData.volume || 0,
            ma10: ma10Map.get(lastData.time) || null,
            ma50: ma50Map.get(lastData.time) || null,
          })
        }
        return
      }

      const candlePrice = param.seriesData.get(candlestickSeries)
      if (candlePrice && 'open' in candlePrice) {
        const date = new Date((param.time as number) * 1000)
        const dataPoint = chartData.find(d => d.time === param.time)
        const cp = candlePrice as CandlestickData

        setLegendData({
          time: date.toLocaleDateString('vi-VN'),
          open: cp.open,
          high: cp.high,
          low: cp.low,
          close: cp.close,
          volume: dataPoint?.volume || 0,
          ma10: ma10Map.get(param.time) || null,
          ma50: ma50Map.get(param.time) || null,
        })
      }
    })

    // Fit content
    chart.timeScale().fitContent()

    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [chartData])

  // Format number for display
  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
  }

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M'
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K'
    return vol.toString()
  }

  return (
    <div className="glass-strong rounded-xl border border-border/20 p-3 h-full flex flex-col min-h-[300px]">
      {/* Header with Legend */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-xs">{symbol}</h3>

          {/* Time Range Buttons */}
          <div className="flex gap-0.5 bg-muted/30 rounded-md p-0.5">
            {(Object.keys(timeRangeConfig) as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-1.5 py-0.5 text-[10px] rounded transition-all duration-200 font-medium ${selectedRange === range
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* OHLCV Legend */}
        {legendData && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px]">
            <span className="text-muted-foreground">{legendData.time}</span>
            <span>
              <span className="text-muted-foreground">O:</span>
              <span className="ml-0.5">{formatNumber(legendData.open)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">H:</span>
              <span className="ml-0.5 text-emerald-500">{formatNumber(legendData.high)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">L:</span>
              <span className="ml-0.5 text-red-500">{formatNumber(legendData.low)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">C:</span>
              <span className={`ml-0.5 ${legendData.close >= legendData.open ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatNumber(legendData.close)}
              </span>
            </span>
            <span>
              <span className="text-muted-foreground">Vol:</span>
              <span className="ml-0.5">{formatVolume(legendData.volume)}</span>
            </span>
            <span>
              <span className="text-amber-500">MA10:</span>
              <span className="ml-0.5">{formatNumber(legendData.ma10)}</span>
            </span>
            <span>
              <span className="text-violet-500">MA50:</span>
              <span className="ml-0.5">{formatNumber(legendData.ma50)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 min-h-[200px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="animate-pulse text-muted-foreground text-sm">
              Đang tải dữ liệu...
            </div>
          </div>
        )}
        {!isLoading && chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">
              Không có dữ liệu
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-1 text-[9px] text-muted-foreground/60 text-center">
        Cuộn chuột để zoom • Kéo để di chuyển
      </div>
    </div>
  )
}
