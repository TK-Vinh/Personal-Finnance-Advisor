import { NextRequest, NextResponse } from "next/server"
import { searchSymbols } from "@/lib/fireant"

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("keywords")

    if (!query) {
        return NextResponse.json([])
    }

    try {
        console.log(`Searching for keywords: ${query}`)
        const results = await searchSymbols(query)
        console.log(`Found ${results.length} results for: ${query}`)
        return NextResponse.json(results)
    } catch (error) {
        console.error("Search API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
