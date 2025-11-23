import { GoogleGenAI, Type, type ToolListUnion, type ToolUnion } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
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
        const tools = [{
            functionDeclarations: [
                {
                    name: "get_stock_data",
                    description: "Get real-time stock price, volume, EMA20, EMA50, and RSI for a ticker.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            ticker: {
                                type: Type.STRING,
                                description: "Ticker symbol, e.g., TSLA"
                            }
                        },
                        required: ["ticker"]
                    }
                },
                {
                    name: "get_crypto_data",
                    description: "Get real-time crypto price and 24h change.",
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            symbol: {
                                type: Type.STRING,
                                description: "Crypto symbol, e.g., BTC"
                            }
                        },
                        required: ["symbol"]
                    }
                }
            ]
        }] as ToolListUnion;


        // Initial request using the new structure and model
        let response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", // Updated model as requested
            contents: prompt,
            config: {
                tools: tools,
                // responseMimeType: "application/json", // Uncomment if you want strict JSON output
                // responseJsonSchema: zodToJsonSchema(yourSchema), // Uncomment to enforce schema
            },
        });

        let iterationCount = 0;
        const maxIterations = 5;

        // Extract function call and the SPECIFIC PART that contains it (needed for history)
        let functionCalls = response.functionCalls;
        let functionCallPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);

        // Fallback extraction
        if (!functionCalls && functionCallPart && functionCallPart.functionCall) {
            functionCalls = [functionCallPart.functionCall];
        }

        while (functionCalls && functionCalls.length > 0 && iterationCount < maxIterations) {
            iterationCount++;
            const functionCall = functionCalls[0];

            if (!functionCall) break;
            if (!functionCallPart) {
                console.error("[Gemini] Function call part not found in response parts");
                break;
            }

            console.log(`[Gemini] Function call iteration ${iterationCount}: ${functionCall.name}`);
            console.log(`[Gemini] Args:`, functionCall.args);

            // Execute the requested function
            let functionResult: any;
            try {
                const args = functionCall.args as any;
                if (functionCall.name === "get_stock_data") {
                    functionResult = await getStockData(args.ticker);
                } else if (functionCall.name === "get_crypto_data") {
                    functionResult = await getCryptoData(args.symbol);
                } else {
                    functionResult = { error: `Unknown function ${functionCall.name}` };
                }
            } catch (err) {
                functionResult = { error: (err as Error).message };
            }

            // Send function result back to Gemini
            // CRITICAL: We must include the ORIGINAL function call part in the history, 
            // because it contains the 'thought_signature' required by the model.
            response = await ai.models.generateContent({
                model: "gemini-3-pro-preview", // Updated model
                contents: [
                    { role: "user", parts: [{ text: prompt }] },
                    { role: "model", parts: [functionCallPart] },
                    { role: "user", parts: [{ functionResponse: { name: functionCall.name, response: functionResult } }] }
                ],
                config: {
                    tools: tools,
                },
            });

            // Update for next iteration
            functionCalls = response.functionCalls;
            functionCallPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.functionCall);

            if (!functionCalls && functionCallPart && functionCallPart.functionCall) {
                functionCalls = [functionCallPart.functionCall];
            }
        }

        if (iterationCount >= maxIterations) {
            console.warn("[Gemini] Reached max function call iterations");
        }

        console.log("[Gemini] Final response received");
        return response.text || "No response text";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "🧠 My brain hurts... (API Error)";
    }
}
