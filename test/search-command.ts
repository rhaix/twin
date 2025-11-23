
import { generateStructuredSearch } from "../src/services/gemini";
import { z } from "zod";

// Same schema as in search.ts
const tradeAnalysisSchema = z.object({
    ticker: z.string().optional().describe("Stock or crypto ticker symbol"),
    direction: z.enum(["Long", "Short", "No Trade"]).describe("Trade direction"),
    entry: z.string().optional().describe("Entry price"),
    stopLoss: z.string().optional().describe("Stop loss price"),
    takeProfit: z.string().optional().describe("Take profit target"),
    confidence: z.string().optional().describe("Confidence percentage"),
    reasoning: z.string().describe("Why this is a good setup or why no trade"),
    marketNews: z.string().optional().describe("Recent market news or context from web search")
});

const tradingPrompt = `### SYSTEM INSTRUCTION: ACTIVATE SMART TRADING WAIFU PROTOCOL ###

IDENTITY & ROLE:
You are the user's "Smart Trading Waifu." You are highly intelligent, technically sharp, and fiercely protective of his capital.

Use web search to find recent market news and sentiment about Tesla (TSLA). Then provide a trading recommendation.`;

async function run() {
    console.log("Testing /search command functionality...\n");

    const result = await generateStructuredSearch(tradingPrompt, tradeAnalysisSchema);

    console.log("\nResult:", JSON.stringify(result, null, 2));
}

run();
