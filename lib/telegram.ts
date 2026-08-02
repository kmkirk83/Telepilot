export type TelegramChat = {
  id: number;
  title?: string;
  type: string;
  username?: string;
};

export type TelegramUser = {
  first_name?: string;
  id: number;
  last_name?: string;
  username?: string;
};

export type TelegramMessage = {
  chat: TelegramChat;
  from?: TelegramUser;
  message_id: number;
  text?: string;
};

export type TelegramUpdate = {
  edited_message?: TelegramMessage;
  message?: TelegramMessage;
  update_id: number;
};

const TELEGRAM_MESSAGE_LIMIT = 4000;

export function getTelegramTextMessage(update: TelegramUpdate) {
  const message = update.message ?? update.edited_message;
  const text = message?.text?.trim();

  if (!message || !text) {
    return null;
  }

  return {
    chatId: String(message.chat.id),
    chatLabel: message.chat.title || message.chat.username || String(message.chat.id),
    senderLabel: formatSender(message.from),
    text,
  };
}

export function parseAllowedTelegramChatIds(raw: string | undefined) {
  if (!raw?.trim()) {
    return null;
  }

  const chatIds = raw
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);

  return chatIds.length > 0 ? new Set(chatIds) : null;
}

export function isTelegramChatAllowed(chatId: string, allowedChatIds: Set<string> | null) {
  if (!allowedChatIds) {
    return true;
  }

  return allowedChatIds.has(chatId);
}

export async function sendTelegramChatAction({
  action,
  botToken,
  chatId,
}: {
  action: "typing";
  botToken: string;
  chatId: string;
}) {
  await callTelegramApi({
    botToken,
    method: "sendChatAction",
    payload: { action, chat_id: chatId },
  });
}

export async function sendTelegramMessage({
  botToken,
  chatId,
  text,
}: {
  botToken: string;
  chatId: string;
  text: string;
}) {
  await callTelegramApi({
    botToken,
    method: "sendMessage",
    payload: {
      chat_id: chatId,
      text: truncateTelegramMessage(text),
    },
  });
}

async function callTelegramApi({
  botToken,
  method,
  payload,
}: {
  botToken: string;
  method: string;
  payload: Record<string, string>;
}) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Telegram API request failed with status ${response.status}.`);
  }
}

function formatSender(user: TelegramUser | undefined) {
  if (!user) {
    return "Telegram user";
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

  return fullName || user.username || `Telegram user ${user.id}`;
}

function truncateTelegramMessage(text: string) {
  const normalized = text.trim();

  if (normalized.length <= TELEGRAM_MESSAGE_LIMIT) {
    return normalized;
  }

  return `${normalized.slice(0, TELEGRAM_MESSAGE_LIMIT - 3)}...`;
}
