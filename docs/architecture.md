# Telepilot — Architecture Overview

This document describes the internal design of Telepilot in more detail than the README provides.

---

## High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Telegram Network                         │
│                                                                  │
│   User ──▶ Telegram Servers ──▶ Telepilot Webhook/Polling        │
│                        ◀── Telegram sendMessage ◀──              │
└──────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │        Telepilot Core        │
                    │                              │
                    │  ┌─────────────────────┐     │
                    │  │  Message Router     │     │
                    │  │  - Auth check       │     │
                    │  │  - Rate limiting    │     │
                    │  │  - Context builder  │     │
                    │  └────────┬────────────┘     │
                    │           │                  │
                    │  ┌────────▼────────────┐     │
                    │  │  Copilot Adapter    │     │
                    │  │  - Token auth       │     │
                    │  │  - Prompt format    │     │
                    │  │  - Retry / backoff  │     │
                    │  └────────┬────────────┘     │
                    │           │                  │
                    └───────────┼──────────────────┘
                                │
                    ┌───────────▼──────────────────┐
                    │     GitHub Copilot API /      │
                    │     GitHub Models Endpoint    │
                    └──────────────────────────────┘
```

---

## Component Descriptions

### Message Router

Responsible for:

- Receiving raw Telegram updates (via webhook HTTP POST or long-polling).
- Validating the webhook signature (`TELEGRAM_WEBHOOK_SECRET`).
- Checking `ALLOWED_TELEGRAM_USERS` access control.
- Extracting the user's message text and building the Copilot prompt.
- Dispatching the prompt to the Copilot Adapter.
- Sending the response back to Telegram via `sendMessage`.

### Copilot Adapter

Responsible for:

- Authenticating with the GitHub Copilot API or GitHub Models endpoint using `GITHUB_TOKEN`.
- Formatting the request payload (`POST /chat/completions`).
- Handling transient API errors with exponential back-off and retries.
- Returning the text of the first `choices[0].message.content`.

### GitHub Action Mode

When run as a GitHub Action (`action.yml`):

- The `prompt` and optional `context` inputs are passed directly to the Copilot Adapter.
- `repo-config` can register multiple repositories with aliases, default branches, and per-repo context.
- `target-repos` selects a subset of configured aliases, or `all` to fan out across every repo.
- `repo-autocomplete-query` returns repository suggestions through the `autocomplete` output.
- The response is written to `$GITHUB_OUTPUT` as the `response` output variable.
- If `telegram-bot-token` and `telegram-chat-id` are provided, the response is additionally posted to Telegram.

---

## API Endpoints

### Telegram Webhook

```
POST /telegram/webhook
Headers:
  X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_WEBHOOK_SECRET>
Body: Telegram Update object (JSON)
```

### Health Check

```
GET /health
Response: { "status": "ok", "version": "1.0.0" }
```

---

## Data Flow — Service Mode

```
1. Telegram sends POST to /telegram/webhook
2. Telepilot validates X-Telegram-Bot-Api-Secret-Token header
3. Message text extracted from Update.message.text
4. Sender's Telegram user ID checked against ALLOWED_TELEGRAM_USERS
5. Prompt constructed: [optional context] + user message
6. POST to GITHUB_COPILOT_ENDPOINT/chat/completions
7. Response text extracted from choices[0].message.content
8. POST to https://api.telegram.org/bot{TOKEN}/sendMessage
```

---

## Configuration Precedence

Environment variables → `.env` file (loaded at startup) → default values hard-coded in source.

---

## Scalability Notes

- Telepilot is stateless; multiple replicas can run behind a load balancer.
- Telegram webhook mode scales better than long-polling because each request is handled independently.
- GitHub Copilot API rate limits are per-user; if many Telegram users share one `GITHUB_TOKEN`, rate limiting may apply.

---

## Future Considerations

- **Live per-repo Copilot dispatch** — replace the current orchestration scaffold with authenticated per-repo completion requests.
- **Conversation history** — maintain per-chat message history for multi-turn conversations.
- **GitHub App authentication** — exchange App credentials for installation tokens automatically.
- **Plugin system** — allow custom handlers for Telegram commands (e.g. `/review`, `/summarise`).
- **Metrics** — expose Prometheus metrics for request counts, latency, and error rates.
