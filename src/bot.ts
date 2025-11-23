import { Bot } from "grammy";
import { startCommand } from "./commands/start";
import { tradeCommand, executeTrade } from "./commands/trade";
import { searchCommand, executeSearch } from "./commands/search";
import { generateResponse } from "./services/gemini";
import { safeEditMessage } from "./utils/telegram";

// 1. Load environment variables
const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is unset");

// 2. Create the bot
const bot = new Bot(token);

// 3. Register Commands (Hook up your files here)
bot.command("start", startCommand);
bot.command("trade", tradeCommand);
bot.command("search", searchCommand);

// 4. Handle generic text
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const chatType = ctx.chat.type;
    const botUsername = ctx.me.username;

    // Group Logic: Only reply if mentioned (not replies)
    const isGroup = chatType === "group" || chatType === "supergroup";
    const isMentioned = text.includes(`@${botUsername}`);

    // Log the incoming message
    console.log(`[Message] From @${ctx.from.username} (${chatType}): "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`);

    if (isGroup && !isMentioned) {
        return; // Ignore normal group chatter and replies
    }

    // Remove @botname from the text before sending to API
    const cleanText = text.replace(new RegExp(`@${botUsername}`, 'g'), '').trim();

    // Show loading message
    const loadingMsg = await ctx.reply("🤔 Thinking...", {
        reply_to_message_id: ctx.message.message_id,
    });

    try {
        // Generate AI Response
        const response = await generateResponse(cleanText);
        await safeEditMessage(
            ctx.api,
            ctx.chat.id,
            loadingMsg.message_id,
            response
        );
    } catch (error) {
        console.error("[AI Response Error]", error);
        await safeEditMessage(
            ctx.api,
            ctx.chat.id,
            loadingMsg.message_id,
            "❌ Sorry, I encountered an error. Please try again."
        );
    }
});

// 5. Handle Button Clicks
bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data;
    console.log(`[Callback] User @${ctx.from.username} clicked: ${data}`);

    if (data === "about_data") {
        await ctx.answerCallbackQuery(); // Stop the loading animation
        await ctx.reply("ℹ️ RoyK es pajaro");
    } else if (data === "help_data") {
        await ctx.answerCallbackQuery();
        await ctx.reply("❓ No hay ayuda, RoyK es pajaro");
    } else if (data === "status_data") {
        await ctx.answerCallbackQuery();
        await ctx.reply("🟢 Si el estatus e que RoyK es pajaro, todo esta bien");
    } else if (data === "trade_data") {
        await ctx.answerCallbackQuery();
        await executeTrade(ctx);
    } else if (data === "search_data") {
        await ctx.answerCallbackQuery();
        await executeSearch(ctx);
    } else {
        await ctx.answerCallbackQuery();
        await ctx.reply("Unknown button clicked.");
    }
});

// 6. Start the bot
console.log("🤖 Bot is running...");
bot.start();
