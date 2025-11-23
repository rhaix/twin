import { Context } from "grammy";
import { generateResponse } from "../services/gemini";
import { tradingPrompts } from "../constants/prompts";
import { safeEditMessage } from "../utils/telegram";

export async function executeSearch(ctx: Context) {
    const loadingMsg = await ctx.reply("🔍 Analyzing market conditions...");

    try {
        // Use the same prompt as /trade but without function calling tools
        // This gives a different perspective - general market analysis vs real-time data
        const searchPrompt = `You are a smart trading assistant analyzing current market conditions.

Based on your knowledge and recent market trends, provide a brief trading analysis.

Focus on:
- Major stocks (TSLA, NVDA, AMD, PLTR) or crypto (BTC, ETH, SOL)
- Current market sentiment and trends
- Any high-probability trading opportunities you're aware of

Format your response for Telegram using HTML tags (<b>bold</b>).

If you identify a good trade setup, provide:
• <b>Ticker</b> and direction (Long/Short)
• <b>Entry, Stop Loss, and Take Profit</b> levels
• <b>Confidence</b> level
• Brief <b>reasoning</b>

If market conditions aren't favorable, say: "Sorry my Handsome Kings, there's just no available trades"`;

        const response = await generateResponse(searchPrompt);

        if (!response) {
            await safeEditMessage(
                ctx.api,
                ctx.chat!.id,
                loadingMsg.message_id,
                "❌ Could not generate analysis. Please try again."
            );
            return;
        }

        await safeEditMessage(
            ctx.api,
            ctx.chat!.id,
            loadingMsg.message_id,
            response
        );
    } catch (error) {
        console.error("[Search Error]", error);
        await safeEditMessage(
            ctx.api,
            ctx.chat!.id,
            loadingMsg.message_id,
            "❌ Error generating analysis. Please try again."
        );
    }
}

export async function searchCommand(ctx: Context) {
    console.log(`[Command] User @${ctx.from?.username} used /search`);
    await executeSearch(ctx);
}
