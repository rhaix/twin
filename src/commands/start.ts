import { Context, InlineKeyboard } from "grammy";

export async function startCommand(ctx: Context) {
    console.log(`[Command] User @${ctx.from?.username} used /start`);
    const keyboard = new InlineKeyboard()
        .text("ℹ️ About", "about_data")
        .text("❓ Help", "help_data")
        .row()
        .text("🟢 Status", "status_data")
        .row()
        .text("📊 Trade (Tools)", "trade_data")
        .text("💭 Analysis (No Tools)", "search_data");

    await ctx.reply("👋 Hola maldito pajaro! Ete bot es de trading y de lo pajaro que e RoyK!\n\nChoose an option:", {
        reply_markup: keyboard,
    });
}
