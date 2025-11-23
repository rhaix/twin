import { Context } from "grammy";
import { generateResponseWithTools } from "../services/gemini";
import { tradingPrompts } from "../constants/prompts";
import { safeEditMessage } from "../utils/telegram";

export async function executeTrade(ctx: Context) {
    const loadingMsg = await ctx.reply("⏳ Analyzing market data...");

    try {
        const fullPrompt = tradingPrompts.default + "\n\n" + tradingPrompts.responseFormat;
        const response = await generateResponseWithTools(fullPrompt);
        await safeEditMessage(
            ctx.api,
            ctx.chat!.id,
            loadingMsg.message_id,
            response
        );
    } catch (error) {
        console.error("[Trade Error]", error);
        await safeEditMessage(
            ctx.api,
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
