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


        // Initialize history with the user's prompt
        const history: any[] = [
            { role: "user", parts: [{ text: prompt }] }
        ];

        // Initial request using the new structure and model
        let response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", // Updated model as requested
            contents: history,
            config: {
                tools: tools,
                // responseMimeType: "application/json", // Uncomment if you want strict JSON output
                // responseJsonSchema: zodToJsonSchema(yourSchema), // Uncomment to enforce schema
            },
        });

        let iterationCount = 0;
        const maxIterations = 10;

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

            // Add the model's request (function call) and our response (function result) to history
            history.push({ role: "model", parts: [functionCallPart] });
            history.push({ role: "user", parts: [{ functionResponse: { name: functionCall.name, response: functionResult } }] });

            // Send function result back to Gemini with FULL history
            response = await ai.models.generateContent({
                model: "gemini-3-pro-preview", // Updated model
                contents: history,
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
            // Force a final response if we're stuck in a loop
            history.push({ role: "user", parts: [{ text: "You have reached the maximum number of function calls. Please summarize the data you have collected so far. If you need more data, specify" }] });
            response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: history,
            });
        }

        console.log("[Gemini] Final response received");
        return response.text || "No response text";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "🧠 My brain hurts... (API Error)";
    }
}

/**
 * Generate a response using Google Search grounding
 * Note: Cannot combine Google Search with structured JSON output due to API limitations
 * @param prompt The user's prompt
 */
export async function generateWithGoogleSearch(prompt: string): Promise<string | null> {
    if (!apiKey) {
        console.warn("⚠️ GEMINI_API_KEY is missing");
        return null;
    }

    console.log(`[Gemini] Google Search Request: ${prompt.substring(0, 100)}...`);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                tools: [
                    { googleSearch: {} }
                ],
            },
        });

        console.log("[Gemini] Search response received");
        return response.text || null;
    } catch (error) {
        console.error("Gemini Search Error:", error);
        return null;
    }
}

/**
 * Generate a structured response using a schema (without Google Search)
 * @param prompt The user's prompt
 * @param schema The Zod schema to validate the response against
 */
export async function generateStructuredResponse<T>(prompt: string, schema: z.ZodType<T>): Promise<T | null> {
    if (!apiKey) {
        console.warn("⚠️ GEMINI_API_KEY is missing");
        return null;
    }

    console.log(`[Gemini] Structured Response Request: ${prompt.substring(0, 100)}...`);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: zodToJsonSchema(schema as any),
            },
        });

        console.log("[Gemini] Structured response received");

        if (response.text) {
            const parsed = JSON.parse(response.text);
            try {
                return schema.parse(parsed);
            } catch (error) {
                // If parsing fails and it's an array, try the first element
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return schema.parse(parsed[0]);
                }
                throw error;
            }
        }

        return null;
    } catch (error) {
        console.error("Gemini Structured Response Error:", error);
        return null;
    }
}
