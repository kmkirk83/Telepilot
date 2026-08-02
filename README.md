# Telepilot

Standalone Telegram copilot webhook for routing chat tasks to OpenAI or Anthropic.

## What it includes

- Next.js webhook endpoint at `/api/integrations/telegram`
- Telegram chat allowlist support
- OpenAI and Anthropic reply providers
- Marketplace-friendly docs for setup, support, and privacy
- Apache 2.0 license

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Configure these environment variables before registering the webhook:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- Optional `TELEGRAM_ALLOWED_CHAT_IDS`
- Optional `TELEGRAM_COPILOT_SYSTEM_PROMPT`

Register the Telegram webhook against:

```text
https://<your-domain>/api/integrations/telegram
```

Send the same secret in the `X-Telegram-Bot-Api-Secret-Token` header when creating the webhook.

## Support and policy docs

- Support: `SUPPORT.md`
- Privacy: `docs/privacy.md`
- Security: `SECURITY.md`
