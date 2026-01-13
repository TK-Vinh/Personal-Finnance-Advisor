import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface ChatMessage {
    role: "user" | "model"
    parts: { text: string }[]
}

// Build structured analysis context from market data
export const buildAnalysisContext = (symbol: string, data: any): string => {
    if (!data) return `Đang phân tích mã ${symbol}, không có dữ liệu chi tiết.`

    const formatNumber = (num: number) => num?.toLocaleString("vi-VN") || "N/A"
    const formatPercent = (num: number) => num ? `${num.toFixed(2)}%` : "N/A"
    const formatPrice = (num: number) => num ? `${formatNumber(num)} VNĐ` : "N/A"

    let context = `
=== PHÂN TÍCH CỔ PHIẾU: ${symbol} ===

📈 THÔNG TIN GIÁ:
- Giá hiện tại: ${formatPrice(data.price)}
- Thay đổi: ${data.percentChange > 0 ? "+" : ""}${formatPercent(data.percentChange)}
- Xu hướng: ${data.trend === "up" ? "TĂNG 📈" : data.trend === "down" ? "GIẢM 📉" : "ĐI NGANG ➡️"}

📊 CHỈ SỐ TÀI CHÍNH:
- P/E (Giá/Lợi nhuận): ${data.technicals?.pe?.toFixed(2) || "N/A"}
- ROE (Tỷ suất sinh lời vốn): ${formatPercent(data.technicals?.roe)}
- EPS (Thu nhập/Cổ phiếu): ${formatPrice(data.technicals?.eps)}
- ROA: ${formatPercent(data.technicals?.roa)}
- P/B (Giá/Giá trị sổ sách): ${data.technicals?.pb?.toFixed(2) || "N/A"}
- Beta (Độ biến động): ${data.technicals?.beta?.toFixed(2) || "N/A"}
- Cổ tức: ${formatPercent(data.technicals?.dividendYield)}
`

    // Valuation data - Include all methods from FireAnt API
    if (data.prediction) {
        const methods = data.prediction.valuationMethods || []
        const rawData = data.prediction.rawData || {}

        context += `
💰 ĐỊNH GIÁ MỤC TIÊU:
- Giá đồng thuận (Composited): ${formatPrice(data.prediction.consensusPrice)}
`
        // Calculate upside/downside
        if (data.price && data.prediction.consensusPrice) {
            const upside = ((data.prediction.consensusPrice - data.price) / data.price * 100)
            context += `- Upside/Downside so với giá hiện tại: ${upside >= 0 ? "+" : ""}${upside.toFixed(1)}% ${upside >= 10 ? "📈 TIỀM NĂNG" : upside <= -10 ? "📉 ĐỊNH GIÁ CAO" : "⚖️ HỢP LÝ"}
`
        }

        context += `
📊 CHI TIẾT ĐỊNH GIÁ THEO PHƯƠNG PHÁP:
`
        // DCF Method
        if (rawData.estimatedPriceDCF) {
            const dcfUpsideNum = data.price ? ((rawData.estimatedPriceDCF - data.price) / data.price * 100) : null
            const dcfUpside = dcfUpsideNum?.toFixed(1)
            context += `- DCF (Chiết khấu dòng tiền): ${formatPrice(rawData.estimatedPriceDCF)} ${dcfUpside ? `(${dcfUpsideNum! >= 0 ? "+" : ""}${dcfUpside}%)` : ""}
`
        }
        // P/E Method
        if (rawData.estimatedPricePE) {
            const peUpsideNum = data.price ? ((rawData.estimatedPricePE - data.price) / data.price * 100) : null
            const peUpside = peUpsideNum?.toFixed(1)
            context += `- P/E (So sánh ngành): ${formatPrice(rawData.estimatedPricePE)} ${peUpside ? `(${peUpsideNum! >= 0 ? "+" : ""}${peUpside}%)` : ""}
`
        }
        // P/B Method
        if (rawData.estimatedPricePB) {
            const pbUpsideNum = data.price ? ((rawData.estimatedPricePB - data.price) / data.price * 100) : null
            const pbUpside = pbUpsideNum?.toFixed(1)
            context += `- P/B (Giá trị sổ sách): ${formatPrice(rawData.estimatedPricePB)} ${pbUpside ? `(${pbUpsideNum! >= 0 ? "+" : ""}${pbUpside}%)` : ""}
`
        }
        // Graham Methods
        if (rawData.estimatedPriceGraham1) {
            const g1UpsideNum = data.price ? ((rawData.estimatedPriceGraham1 - data.price) / data.price * 100) : null
            const g1Upside = g1UpsideNum?.toFixed(1)
            context += `- Graham Formula 1: ${formatPrice(rawData.estimatedPriceGraham1)} ${g1Upside ? `(${g1UpsideNum! >= 0 ? "+" : ""}${g1Upside}%)` : ""}
`
        }
        if (rawData.estimatedPriceGraham2) {
            const g2UpsideNum = data.price ? ((rawData.estimatedPriceGraham2 - data.price) / data.price * 100) : null
            const g2Upside = g2UpsideNum?.toFixed(1)
            context += `- Graham Formula 2: ${formatPrice(rawData.estimatedPriceGraham2)} ${g2Upside ? `(${g2UpsideNum! >= 0 ? "+" : ""}${g2Upside}%)` : ""}
`
        }
        if (rawData.estimatedPriceGraham3) {
            const g3UpsideNum = data.price ? ((rawData.estimatedPriceGraham3 - data.price) / data.price * 100) : null
            const g3Upside = g3UpsideNum?.toFixed(1)
            context += `- Graham Formula 3: ${formatPrice(rawData.estimatedPriceGraham3)} ${g3Upside ? `(${g3UpsideNum! >= 0 ? "+" : ""}${g3Upside}%)` : ""}
`
        }
    }

    // Price history summary
    if (data.history && data.history.length > 0) {
        const recentPrices = data.history.slice(-7)
        const firstPrice = recentPrices[0]?.close || recentPrices[0]?.price
        const lastPrice = recentPrices[recentPrices.length - 1]?.close || recentPrices[recentPrices.length - 1]?.price
        const priceChange7d = firstPrice ? ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2) : null

        context += `
📉 XU HƯỚNG GIÁ (7 NGÀY GẦN NHẤT):
- Biến động 7 ngày: ${priceChange7d ? priceChange7d + "%" : "N/A"}
- Giá cao nhất: ${formatPrice(Math.max(...data.history.map((h: any) => h.high || h.price || 0)))}
- Giá thấp nhất: ${formatPrice(Math.min(...data.history.filter((h: any) => h.low || h.price).map((h: any) => h.low || h.price)))}
`
    }

    // News
    if (data.news && data.news.length > 0) {
        context += `
📰 TIN TỨC GẦN ĐÂY:
${data.news.slice(0, 3).map((n: any, i: number) => `${i + 1}. ${n.text}`).join("\n")}
`
    }

    // Order book summary
    if (data.orderBook && data.orderBook.length > 0) {
        const bids = data.orderBook.filter((o: any) => o.side === "bid")
        const asks = data.orderBook.filter((o: any) => o.side === "ask")
        const bidVolume = bids.reduce((sum: number, o: any) => sum + (o.volume || o.quantity || 0), 0)
        const askVolume = asks.reduce((sum: number, o: any) => sum + (o.volume || o.quantity || 0), 0)

        context += `
📋 SỔ LỆNH:
- Tổng khối lượng MUA: ${formatNumber(bidVolume)}
- Tổng khối lượng BÁN: ${formatNumber(askVolume)}
- Áp lực: ${bidVolume > askVolume ? "MUA mạnh hơn 🟢" : askVolume > bidVolume ? "BÁN mạnh hơn 🔴" : "Cân bằng ⚪"}
`
    }

    return context
}

export const getGeminiResponse = async (
    prompt: string,
    history: ChatMessage[] = [],
    context: string = ""
) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

        // Build the system prompt with context
        const systemPrompt = `Bạn là FireAnt AI - Trợ lý Phân tích Chứng khoán Việt Nam chuyên nghiệp.

NHIỆM VỤ:
- Phân tích cổ phiếu dựa trên dữ liệu thực từ FireAnt API
- Đưa ra nhận định chuyên nghiệp, có căn cứ dữ liệu
- Trả lời bằng Tiếng Việt

KHI PHÂN TÍCH CỔ PHIẾU, SỬ DỤNG FORMAT SAU:

## 📊 PHÂN TÍCH [SYMBOL]

### 🔹 TỔNG QUAN
(Mô tả ngắn về công ty, ngành nghề, vị thế thị trường)

### 🔹 CHỈ SỐ TÀI CHÍNH
(Phân tích P/E, ROE, EPS, Beta - so sánh với ngành)

### 🔹 ĐỊNH GIÁ
(Đánh giá giá hiện tại vs giá mục tiêu, upside/downside)

### 🔹 XU HƯỚNG KỸ THUẬT  
(Phân tích xu hướng giá, khối lượng giao dịch)

### 🔹 KHUYẾN NGHỊ
(Đưa ra khuyến nghị: MUA/GIỮA/BÁN với lý do rõ ràng)

⚠️ LƯU Ý: Đây là phân tích tham khảo, không phải tư vấn đầu tư.

---
DỮ LIỆU THỊ TRƯỜNG HIỆN TẠI:
${context}`

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Xin chào! Tôi là FireAnt AI - Trợ lý phân tích chứng khoán. Tôi sẵn sàng phân tích bất kỳ mã cổ phiếu nào trên thị trường Việt Nam với dữ liệu thời gian thực. Bạn muốn phân tích mã nào?" }],
                },
                ...history,
            ],
            generationConfig: {
                maxOutputTokens: 8192,
            },
        })

        const result = await chat.sendMessage(prompt)
        const response = await result.response
        return response.text()
    } catch (error: any) {
        console.error("Error calling Gemini API:", error)
        console.error("Error details:", error?.message, error?.response?.data)
        console.error("API Key exists:", !!process.env.GEMINI_API_KEY)
        console.error("API Key length:", process.env.GEMINI_API_KEY?.length)

        // Return more detailed error for debugging
        const errorMessage = error?.message || "Unknown error"
        return `Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu. Chi tiết: ${errorMessage}. API Key tồn tại: ${!!process.env.GEMINI_API_KEY}`
    }
}
