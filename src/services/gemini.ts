import { GoogleGenAI } from "@google/genai";
import { getStockData, getCryptoData } from "./marketData";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is missing in .env");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export async function generateResponse(prompt: string): Promise<string> {
    if (!apiKey) return "⚠️ I need a GEMINI_API_KEY to think!";

    console.log(`[Gemini] Request: ${prompt.substring(0, 100)}...`);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
        });
        console.log("[Gemini] Response received");
        return response.text || "No response text";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "🧠 My brain hurts... (API Error)";
    }
}

/**
 * Generate response with function calling support
 * Allows Gemini to dynamically fetch market data using tools
 */
export async function generateResponseWithTools(prompt: string): Promise<string> {
    if (!apiKey) return "⚠️ I need a GEMINI_API_KEY to think!";

    console.log(`[Gemini] Request with tools: ${prompt.substring(0, 100)}...`);

    try {
        // Define function declarations for the model
        const tools = {
            functionDeclarations: [
                {
                    name: "get_stock_data",
                    description: "Get real-time stock price, volume, and technical indicators (EMA, RSI) for a given ticker symbol. Use this for stocks like TSLA, NVDA, AMD, PLTR, MSTR, etc.",
                    parameters: {
                        type: "object",
                        properties: {
                            ticker: {
                                type: "string",
                                description: "Stock ticker symbol (e.g., TSLA, NVDA, AAPL, AMD, PLTR, MSTR)"
                            }
                        },
                        required: ["ticker"]
                    }
                },
                {
                    name: "get_crypto_data",
                    description: "Get real-time cryptocurrency price and 24-hour change. Use this for crypto symbols like BTC, ETH, SOL on weekends or when analyzing crypto markets.",
                    parameters: {
                        type: "object",
                        properties: {
                            symbol: {
                                type: "string",
                                description: "Cryptocurrency symbol (e.g., BTC, ETH, SOL)"
                            }
                        },
                        required: ["symbol"]
                    }
                }
            ]
        };

        // Initial request with tools enabled
        let response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            tools: [tools],
        });

        let iterationCount = 0;
        const maxIterations = 5; // Prevent infinite loops

        // Handle function calling loop
        while (response.functionCalls && response.functionCalls.length > 0 && iterationCount < maxIterations) {
            iterationCount++;
            console.log(`[Gemini] Function call iteration ${iterationCount}`);

            const functionCall = response.functionCalls[0];
            console.log(`[Gemini] Calling function: ${functionCall.name} with args:`, functionCall.args);

            // Execute the requested function
            let functionResponse: any;
            try {
                if (functionCall.name === "get_stock_data") {
                    const data = await getStockData(functionCall.args.ticker);
                    functionResponse = { content: data };
                } else if (functionCall.name === "get_crypto_data") {
                    const data = await getCryptoData(functionCall.args.symbol);
                    functionResponse = { content: data };
                } else {
                    functionResponse = { error: `Unknown function: ${functionCall.name}` };
                }
            } catch (error) {
                functionResponse = { error: (error as Error).message };
            }

            console.log(`[Gemini] Function response:`, functionResponse);

            // Send function result back to Gemini
            response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: [
                    { role: "user", parts: [{ text: prompt }] },
                    { role: "model", parts: [{ functionCall: functionCall }] },
                    { role: "function", parts: [{ functionResponse: { name: functionCall.name, response: functionResponse } }] }
                ],
                tools: [tools],
            });
        }

        if (iterationCount >= maxIterations) {
            console.warn("[Gemini] Max function call iterations reached");
        }

        console.log("[Gemini] Final response received");
        return response.text || "No response text";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "🧠 My brain hurts... (API Error)";
    }
}
