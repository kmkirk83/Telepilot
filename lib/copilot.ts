import type { AppEnv } from "./env";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-latest";
const DEFAULT_SYSTEM_PROMPT =
  "You are Telepilot. Help the user complete software and product tasks. Be concise, action-oriented, and explicit about any missing context or risks.";

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

type AnthropicMessageResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

export type CopilotReply = {
  provider: "openai" | "anthropic";
  text: string;
};

export type CopilotRequest = {
  env: AppEnv;
  message: string;
  systemPrompt?: string;
};

export async function createCopilotReply({ env, message, systemPrompt }: CopilotRequest) {
  const prompt = systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;

  if (env.OPENAI_API_KEY) {
    return createOpenAiReply({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      prompt,
      message,
    });
  }

  if (env.ANTHROPIC_API_KEY) {
    return createAnthropicReply({
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL,
      prompt,
      message,
    });
  }

  throw new Error("No copilot provider is configured.");
}

async function createOpenAiReply({
  apiKey,
  model,
  prompt,
  message,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  message: string;
}): Promise<CopilotReply> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: message },
      ],
    }),
  });

  const payload = (await response.json().catch(() => null)) as OpenAiChatCompletionResponse | null;

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const text = normalizeContent(payload?.choices?.[0]?.message?.content);

  if (!text) {
    throw new Error("OpenAI response did not include a text reply.");
  }

  return {
    provider: "openai",
    text,
  };
}

async function createAnthropicReply({
  apiKey,
  model,
  prompt,
  message,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  message: string;
}): Promise<CopilotReply> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: prompt,
      messages: [{ role: "user", content: message }],
    }),
  });

  const payload = (await response.json().catch(() => null)) as AnthropicMessageResponse | null;

  if (!response.ok) {
    throw new Error(`Anthropic request failed with status ${response.status}.`);
  }

  const text = payload?.content
    ?.filter((item) => item.type === "text" && Boolean(item.text?.trim()))
    .map((item) => item.text?.trim())
    .join("\n\n");

  if (!text) {
    throw new Error("Anthropic response did not include a text reply.");
  }

  return {
    provider: "anthropic",
    text,
  };
}

function normalizeContent(content: string | Array<{ type?: string; text?: string }> | undefined) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .filter((item) => item.type === "text" && Boolean(item.text?.trim()))
    .map((item) => item.text?.trim())
    .join("\n\n")
    .trim();
}
