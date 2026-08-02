import { NextRequest, NextResponse } from "next/server";

import { readAppEnv } from "../../../../lib/env";
import { processTelegramCopilotUpdate } from "../../../../lib/telegram-copilot";
import type { TelegramUpdate } from "../../../../lib/telegram";

export async function POST(request: NextRequest) {
  const envResult = readAppEnv();

  if (!envResult.success) {
    return NextResponse.json({ error: "Invalid environment configuration." }, { status: 500 });
  }

  const env = envResult.data;

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Telegram connector is not configured." }, { status: 503 });
  }

  if (request.headers.get("x-telegram-bot-api-secret-token") !== env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let update: TelegramUpdate;

  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  await processTelegramCopilotUpdate({ env, update });

  return NextResponse.json({ ok: true });
}
