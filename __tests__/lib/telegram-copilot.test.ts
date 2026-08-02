import { processTelegramCopilotUpdate } from "../../lib/telegram-copilot";
import type { AppEnv } from "../../lib/env";
import type { TelegramUpdate } from "../../lib/telegram";

const baseEnv: AppEnv = {
  NODE_ENV: "test",
  APP_URL: undefined,
  OPENAI_API_KEY: "openai-key",
  OPENAI_MODEL: undefined,
  ANTHROPIC_API_KEY: undefined,
  ANTHROPIC_MODEL: undefined,
  TELEGRAM_BOT_TOKEN: "telegram-token",
  TELEGRAM_WEBHOOK_SECRET: "webhook-secret",
  TELEGRAM_ALLOWED_CHAT_IDS: undefined,
  TELEGRAM_COPILOT_SYSTEM_PROMPT: undefined,
};

const update: TelegramUpdate = {
  update_id: 1,
  message: {
    message_id: 2,
    chat: {
      id: 123,
      type: "private",
      username: "telepilot-user",
    },
    from: {
      id: 456,
      first_name: "Casey",
      last_name: "Jones",
      username: "casey",
    },
    text: "Summarize the release blockers",
  },
};

function mockJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("processTelegramCopilotUpdate", () => {
  beforeEach(() => {
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("routes Telegram messages through the configured OpenAI provider", async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }))
      .mockResolvedValueOnce(
        mockJsonResponse({
          choices: [{ message: { content: "Here are the current release blockers." } }],
        }),
      )
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }));

    const result = await processTelegramCopilotUpdate({ env: baseEnv, update });

    expect(result).toEqual({ outcome: "replied", chatId: "123", provider: "openai" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.telegram.org/bottelegram-token/sendChatAction",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://api.telegram.org/bottelegram-token/sendMessage",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("blocks unauthorized chats when TELEGRAM_ALLOWED_CHAT_IDS is configured", async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue(mockJsonResponse({ ok: true }));

    const result = await processTelegramCopilotUpdate({
      env: { ...baseEnv, TELEGRAM_ALLOWED_CHAT_IDS: "999,1000" },
      update,
    });

    expect(result).toEqual({ outcome: "blocked", chatId: "123" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottelegram-token/sendMessage",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns the help text for Telegram bot commands", async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockResolvedValue(mockJsonResponse({ ok: true }));

    const result = await processTelegramCopilotUpdate({
      env: baseEnv,
      update: {
        ...update,
        message: {
          ...update.message!,
          text: "/help",
        },
      },
    });

    expect(result).toEqual({ outcome: "help", chatId: "123" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends a fallback error message when the provider call fails", async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }))
      .mockResolvedValueOnce(mockJsonResponse({ error: "boom" }, 500))
      .mockResolvedValueOnce(mockJsonResponse({ ok: true }));

    const result = await processTelegramCopilotUpdate({ env: baseEnv, update });

    expect(result).toEqual({ outcome: "error", chatId: "123" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
