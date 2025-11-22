import { Bot } from "grammy";
import { startCommand } from "./commands/start";

// 1. Load environment variables
const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

// 2. Create the bot
const bot = new Bot(token);

// 3. Register Commands (Hook up your files here)
bot.command("start", startCommand);

// 4. Handle generic text (Optional)
bot.on("message:text", (ctx) => {
    ctx.reply(`You said: ${ctx.message.text}`);
});

// 5. Handle Button Clicks
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;

    if (data === "about_data") {
        await ctx.answerCallbackQuery(); // Stop the loading animation
        await ctx.reply("ℹ️ I am a bot built with Bun and Grammy!");
    } else if (data === "help_data") {
        await ctx.answerCallbackQuery();
        await ctx.reply("❓ Just type /start to see the menu.");
    } else if (data === "status_data") {
        await ctx.answerCallbackQuery();
        await ctx.reply("🟢 Systems are operational.");
    } else {
        await ctx.answerCallbackQuery();
        await ctx.reply("Unknown button clicked.");
    }
});

// 6. Start the bot
console.log("🤖 Bot is running...");
bot.start();
