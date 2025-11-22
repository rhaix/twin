import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is missing in .env");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export async function generateResponse(prompt: string): Promise<string> {
    if (!apiKey) return "⚠️ I need a GEMINI_API_KEY to think!";

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
        });
        return response.text || "No response text";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "🧠 My brain hurts... (API Error)";
    }
}
