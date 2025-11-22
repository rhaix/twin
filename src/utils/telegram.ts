import { Api } from "grammy";

const TELEGRAM_MAX_LENGTH = 4096;

/**
 * Chunks a long message into smaller pieces that fit within Telegram's limit.
 * Tries to split at newlines to preserve readability.
 */
function chunkMessage(text: string, maxLength: number = TELEGRAM_MAX_LENGTH): string[] {
    if (text.length <= maxLength) {
        return [text];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        // Try to find a good split point (newline) within the limit
        let splitIndex = maxLength;
        const lastNewline = remaining.lastIndexOf('\n', maxLength);

        if (lastNewline > maxLength * 0.5) {
            // If we found a newline in the latter half, use it
            splitIndex = lastNewline + 1;
        } else {
            // Otherwise, try to split at a space
            const lastSpace = remaining.lastIndexOf(' ', maxLength);
            if (lastSpace > maxLength * 0.5) {
                splitIndex = lastSpace + 1;
            }
        }

        chunks.push(remaining.substring(0, splitIndex));
        remaining = remaining.substring(splitIndex);
    }

    return chunks;
}

/**
 * Safely send a message with formatting fallback and automatic chunking.
 * Tries HTML, MarkdownV2, and Markdown parse modes before falling back to plain text.
 * If message is too long, splits it into multiple messages.
 */
export async function safeEditMessage(
    api: Api,
    chatId: number,
    messageId: number,
    text: string
): Promise<void> {
    const chunks = chunkMessage(text);
    const parseModes: Array<"HTML" | "MarkdownV2" | "Markdown"> = ["HTML", "MarkdownV2", "Markdown"];

    if (chunks.length === 0) {
        console.warn("[Telegram] No chunks to send");
        return;
    }

    // Send the first chunk by editing the existing message
    await sendChunkWithFallback(api, chatId, messageId, chunks[0]!, parseModes, true);

    // Send remaining chunks as new messages
    for (let i = 1; i < chunks.length; i++) {
        await sendChunkWithFallback(api, chatId, null, chunks[i]!, parseModes, false);
    }
}

/**
 * Helper function to send a single chunk with parse mode fallback
 */
async function sendChunkWithFallback(
    api: Api,
    chatId: number,
    messageId: number | null,
    text: string,
    parseModes: Array<"HTML" | "MarkdownV2" | "Markdown">,
    isEdit: boolean
): Promise<void> {
    // Try each parse mode in order
    for (const parseMode of parseModes) {
        try {
            if (isEdit && messageId !== null) {
                await api.editMessageText(chatId, messageId, text, {
                    parse_mode: parseMode,
                });
            } else {
                await api.sendMessage(String(chatId), text, {
                    parse_mode: parseMode,
                });
            }
            return; // Success! Exit early
        } catch (error: any) {
            // If it's a parsing error, try the next mode
            if (error?.description?.includes("can't parse") || error?.description?.includes("parse entities")) {
                console.warn(`[Telegram] ${parseMode} parsing failed, trying next mode...`);
                continue;
            } else {
                // If it's a different error (not parsing), re-throw it
                throw error;
            }
        }
    }

    // All parse modes failed, send as plain text
    console.warn("[Telegram] All parse modes failed, sending as plain text");
    if (isEdit && messageId !== null) {
        await api.editMessageText(chatId, messageId, text);
    } else {
        await api.sendMessage(String(chatId), text);
    }
}
