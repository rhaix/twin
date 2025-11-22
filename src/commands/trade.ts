import { Context } from "grammy";
import { generateResponse } from "../services/gemini";
import { tradingPrompts } from "../constants/prompts";

export async function executeTrade(ctx: Context) {
    const loadingMsg = await ctx.reply("⏳ Analyzing market data...");

    try {
        const response = await generateResponse(tradingPrompts.default);
        await ctx.api.editMessageText(
            ctx.chat!.id,
            loadingMsg.message_id,
            response,
            { parse_mode: "Markdown" }
        );
    } catch (error) {
        console.error("[Trade Error]", error);
        await ctx.api.editMessageText(
            ctx.chat!.id,
            loadingMsg.message_id,
            "❌ Error generating response. Please try again."
        );
    }
}

export async function tradeCommand(ctx: Context) {
    console.log(`[Command] User @${ctx.from?.username} used /trade`);
    await executeTrade(ctx);
}
