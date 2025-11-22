import { Context, InlineKeyboard } from "grammy";

export async function startCommand(ctx: Context) {
    console.log(`[Command] User @${ctx.from?.username} used /start`);
    const keyboard = new InlineKeyboard()
        .text("ℹ️ About", "about_data")
        .text("❓ Help", "help_data")
        .row()
        .text("🟢 Status", "status_data")
        .text("Trade", "trade_data");

    await ctx.reply("👋 Hello! I am your Bun-powered bot running on Railway!\n\nChoose an option:", {
        reply_markup: keyboard,
    });
}
