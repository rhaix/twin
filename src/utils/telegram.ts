import { Api } from "grammy";

/**
 * Safely edit a message with formatting fallback.
 * Tries HTML parse mode first, falls back to plain text if parsing fails.
 */
export async function safeEditMessage(
    api: Api,
    chatId: number,
    messageId: number,
    text: string
): Promise<void> {
    try {
        // Try with HTML formatting first
        await api.editMessageText(chatId, messageId, text, {
            parse_mode: "HTML",
        });
    } catch (error: any) {
        // If parsing fails, send as plain text
        if (error?.description?.includes("can't parse") || error?.description?.includes("parse entities")) {
            console.warn("[Telegram] HTML parsing failed, sending as plain text");
            await api.editMessageText(chatId, messageId, text);
        } else {
            // Re-throw if it's a different error
            throw error;
        }
    }
}
