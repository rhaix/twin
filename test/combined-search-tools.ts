
import { generateStructuredSearchWithTools } from "../src/services/gemini";
import { z } from "zod";

// Schema for a stock analysis that combines web search + real-time data
const stockAnalysisSchema = z.object({
    ticker: z.string().describe("Stock ticker symbol"),
    currentPrice: z.number().optional().describe("Current stock price from real-time data"),
    companyNews: z.string().optional().describe("Recent news about the company from web search"),
    recommendation: z.string().describe("Buy, Hold, or Sell recommendation"),
    reasoning: z.string().describe("Reasoning for the recommendation")
});

async function run() {
    console.log("Testing generateStructuredSearchWithTools...");
    console.log("This combines Google Search + custom tools (stock data) + structured output\n");

    const result = await generateStructuredSearchWithTools(
        "Analyze Tesla stock (TSLA). Search for recent news and get the current price, then provide a recommendation.",
        stockAnalysisSchema
    );

    console.log("\nResult:", JSON.stringify(result, null, 2));
}

run();
