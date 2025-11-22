import { Context } from "grammy";
import { generateResponse } from "../services/gemini";
import { tradingPrompts } from "../constants/prompts";

export async function executeTrade(ctx: Context) {
    await ctx.replyWithChatAction("typing");
    const response = await generateResponse(tradingPrompts.default);
    await ctx.reply(response);
}

export async function tradeCommand(ctx: Context) {
    console.log(`[Command] User @${ctx.from?.username} used /trade`);
    await executeTrade(ctx);
}
