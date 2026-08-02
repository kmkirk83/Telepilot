# Telepilot 🤖✈️

**Telepilot** connects [GitHub Copilot](https://github.com/features/copilot) to [Telegram](https://telegram.org), letting you have full developer conversations — write, review and debug code — from your phone or any device with Telegram installed.

## Features

- 💬 **Conversational context** — messages in the same chat are remembered across turns
- 🔄 `/new` — start a fresh conversation at any time
- 🔒 **Access control** — restrict the bot to specific Telegram user IDs
- 🐳 **Docker support** — one-command deploy with Docker Compose
- ⚡ **Async** — built on `python-telegram-bot` v21 and `httpx` for high performance

---

## Quick Start

### 1. Create a Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy the **bot token** you receive

### 2. Obtain a GitHub Token

You need a GitHub Personal Access Token (PAT) for an account with an active **GitHub Copilot** subscription.

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate a **fine-grained** or **classic** token
3. No specific scopes are required beyond having an active Copilot subscription

### 3. Configure the Bot

```bash
cp .env.example .env
# Edit .env with your tokens
```

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | Token from @BotFather |
| `GITHUB_TOKEN` | ✅ | GitHub PAT with Copilot access |
| `ALLOWED_USER_IDS` | ❌ | Comma-separated Telegram user IDs (empty = all) |
| `COPILOT_API_URL` | ❌ | Copilot API base URL (default: `https://api.githubcopilot.com`) |
| `COPILOT_MODEL` | ❌ | Model name (default: `gpt-4o`) |
| `MAX_HISTORY` | ❌ | Max conversation turns to remember per user (default: `20`) |

### 4. Run with Docker Compose (recommended)

```bash
docker compose up -d
```

### 4. Run locally

```bash
pip install -r requirements.txt
python main.py
```

---

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Introduction and welcome message |
| `/help` | Show all available commands |
| `/new` | Clear conversation history and start fresh |
| `/model` | Show the currently active Copilot model |

Any other text message is forwarded to GitHub Copilot and the response is sent back to you.

---

## Development

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest
```

---

## Architecture

```
main.py              ← entry point, wires Telegram app + Copilot client
config.py            ← loads & validates environment variables
bot/
  handlers.py        ← /start, /help, /new, /model, message handler
copilot/
  client.py          ← async GitHub Copilot API client (chat + streaming)
tests/               ← pytest test suite
```

---

## Requirements

- Python 3.12+
- GitHub account with an active [Copilot subscription](https://github.com/features/copilot)
- Telegram account
