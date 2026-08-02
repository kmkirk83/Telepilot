import { createCopilotReply } from "./copilot";
import type { AppEnv } from "./env";
import {
  getTelegramTextMessage,
  isTelegramChatAllowed,
  parseAllowedTelegramChatIds,
  sendTelegramChatAction,
  sendTelegramMessage,
  type TelegramUpdate,
} from "./telegram";

const HELP_MESSAGE = [
  "Telepilot is ready.",
  "",
  "Send any plain-text task and I will route it to the configured copilot provider.",
  "Optional commands:",
  "/help — show this message",
  "/start — confirm the bot is online",
].join("\n");

const ACCESS_DENIED_MESSAGE =
  "This Telegram chat is not allowed to use Telepilot. Add the chat ID to TELEGRAM_ALLOWED_CHAT_IDS to authorize it.";
const INVALID_MESSAGE_MESSAGE =
  "Send a plain-text task for Telepilot to work on. Attachments and empty messages are ignored.";
const FAILURE_MESSAGE =
  "Telepilot could not process that request right now. Check the provider credentials and try again.";

export async function processTelegramCopilotUpdate({
  env,
  update,
}: {
  env: AppEnv;
  update: TelegramUpdate;
}) {
  const message = getTelegramTextMessage(update);

  if (!message) {
    return { outcome: "ignored" as const };
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is required to respond to Telegram messages.");
  }

  const allowedChatIds = parseAllowedTelegramChatIds(env.TELEGRAM_ALLOWED_CHAT_IDS);

  if (!isTelegramChatAllowed(message.chatId, allowedChatIds)) {
    await sendTelegramMessage({
      botToken: env.TELEGRAM_BOT_TOKEN,
      chatId: message.chatId,
      text: ACCESS_DENIED_MESSAGE,
    });

    return { outcome: "blocked" as const, chatId: message.chatId };
  }

  if (message.text === "/help" || message.text === "/start") {
    await sendTelegramMessage({
      botToken: env.TELEGRAM_BOT_TOKEN,
      chatId: message.chatId,
      text: HELP_MESSAGE,
    });

    return { outcome: "help" as const, chatId: message.chatId };
  }

  if (!message.text.trim()) {
    await sendTelegramMessage({
      botToken: env.TELEGRAM_BOT_TOKEN,
      chatId: message.chatId,
      text: INVALID_MESSAGE_MESSAGE,
    });

    return { outcome: "invalid" as const, chatId: message.chatId };
  }

  await sendTelegramChatAction({
    action: "typing",
    botToken: env.TELEGRAM_BOT_TOKEN,
    chatId: message.chatId,
  });

  try {
    const reply = await createCopilotReply({
      env,
      message: [
        `Telegram sender: ${message.senderLabel}`,
        `Telegram chat: ${message.chatLabel}`,
        "",
        message.text,
      ].join("\n"),
      systemPrompt: env.TELEGRAM_COPILOT_SYSTEM_PROMPT,
    });

    await sendTelegramMessage({
      botToken: env.TELEGRAM_BOT_TOKEN,
      chatId: message.chatId,
      text: reply.text,
    });

    return { outcome: "replied" as const, chatId: message.chatId, provider: reply.provider };
  } catch {
    await sendTelegramMessage({
      botToken: env.TELEGRAM_BOT_TOKEN,
      chatId: message.chatId,
      text: FAILURE_MESSAGE,
    });

    return { outcome: "error" as const, chatId: message.chatId };
  }
}
