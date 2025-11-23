import { Context } from "grammy";
import { generateWithGoogleSearch } from "../services/gemini";
import { tradingPrompts } from "../constants/prompts";
import { safeEditMessage } from "../utils/telegram";

export async function executeSearch(ctx: Context) {
    const loadingMsg = await ctx.reply("🔍 Analyzing market conditions...");

    try {
        // Use Google Search with the trading prompt
        const fullPrompt = tradingPrompts.default + "\n\n" + tradingPrompts.responseFormat + "\n\nIMPORTANT: Use web search to find recent market news, sentiment, and price action before making your recommendation.";
        const response = await generateWithGoogleSearch(fullPrompt);

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
