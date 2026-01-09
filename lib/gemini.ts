import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface ChatMessage {
    role: "user" | "model"
    parts: { text: string }[]
}

export const getGeminiResponse = async (
    prompt: string,
    history: ChatMessage[] = [],
    context: string = ""
) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" })

        // Build the system prompt with context
        const systemPrompt = `You are FireAnt AI Trading Assistant, specialized in the Vietnamese stock market. 
    Current Market Context: ${context}
    Provide professional, data-driven financial insights. 
    If you don't have specific data, state that you are analyzing based on current trends.
    Keep responses concise and helpful.`

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: systemPrompt }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am FireAnt AI your trading assistant. How can I help you today?" }],
                },
                ...history,
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        })

        const result = await chat.sendMessage(prompt)
        const response = await result.response
        return response.text()
    } catch (error) {
        console.error("Error calling Gemini API:", error)
        return "I'm sorry, I encountered an error while processing your request. Please try again later."
    }
}
