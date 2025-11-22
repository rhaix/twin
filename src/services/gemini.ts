import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is missing in .env");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export async function generateResponse(prompt: string): Promise<string> {
    if (!apiKey) return "⚠️ I need a GEMINI_API_KEY to think!";

    console.log(`[Gemini] Sending prompt: "${prompt.substring(0, 50)}${prompt.length > 50 ? "..." : ""}"`);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("[Gemini] Response generated successfully.");
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        return "🧠 My brain hurts... (API Error)";
    }
}
