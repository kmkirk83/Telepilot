# Telepilot

> **Telegram connector for GitHub Copilot** — ask Copilot anything from your Telegram chat.

[![CI](https://github.com/kmkirk83/Telepilot/actions/workflows/ci.yml/badge.svg)](https://github.com/kmkirk83/Telepilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-Telepilot-blue?logo=github)](https://github.com/marketplace)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/kmkirk83?label=Sponsors&logo=githubsponsors)](https://github.com/sponsors/kmkirk83)
[![Open Collective](https://img.shields.io/opencollective/all/telepilot?label=Open%20Collective&logo=opencollective)](https://opencollective.com/telepilot)

---

## Table of Contents

- [What Telepilot Does](#what-telepilot-does)
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Docker / Deployment](#docker--deployment)
- [GitHub Action Usage](#github-action-usage)
- [Multi-Repository Orchestration](#multi-repository-orchestration)
- [Security & Secrets Handling](#security--secrets-handling)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Sponsorship & Support](#sponsorship--support)
- [Changelog](#changelog)
- [Marketplace Publication Checklist](#marketplace-publication-checklist)
- [License](#license)

---

## What Telepilot Does

Telepilot is a bridge between **Telegram** and **GitHub Copilot**. It lets you:

- Send natural-language questions from any Telegram chat and receive Copilot-generated answers in real time.
- Trigger Copilot-assisted code reviews, PR summaries, or repository Q&A directly from Telegram.
- Optionally run as a **GitHub Actions** step to post Copilot responses as comments or artifacts.

```
Telegram User ──▶ Telegram Bot ──▶ Telepilot Service ──▶ GitHub Copilot API
                                           │
                                           ▼
                               Response ──▶ Telegram User
```

---

## Architecture Overview

| Layer | Technology | Purpose |
|---|---|---|
| **Telegram Interface** | Telegram Bot API (webhooks or long-polling) | Receives user messages and sends responses |
| **Connector Service** | Node.js / Python (configurable) | Routes messages between Telegram and Copilot |
| **Copilot Integration** | GitHub Copilot API / GitHub Models | Generates AI responses |
| **CI/CD** | GitHub Actions | Automated testing and releases |
| **Packaging** | Docker | Portable deployment |

### Message Flow

1. User sends a message to the Telegram bot.
2. Telepilot receives the message via webhook or polling.
3. The message is forwarded to GitHub Copilot with optional context (repo, branch, file).
4. Copilot's response is sent back to the user in Telegram.

---

## Prerequisites

- **Node.js** ≥ 18 or **Python** ≥ 3.11 (depending on the connector implementation you deploy)
- **Telegram Bot Token** — create a bot via [@BotFather](https://t.me/BotFather)
- **GitHub Personal Access Token** with `copilot` or `models` scope, or a **GitHub App** with Copilot API access
- **Docker** (optional, for containerised deployment)
- A publicly reachable HTTPS endpoint if using Telegram webhooks (or configure long-polling for development)

---

## Environment Variables

Copy `.env.example` to `.env` and populate the values before running:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | Token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBHOOK_URL` | ⬜ | Public HTTPS URL for Telegram webhooks (omit to use long-polling) |
| `TELEGRAM_WEBHOOK_SECRET` | ⬜ | Secret token to validate webhook requests from Telegram |
| `GITHUB_TOKEN` | ✅ | GitHub PAT or App installation token with Copilot/Models access |
| `GITHUB_COPILOT_ENDPOINT` | ⬜ | Override the Copilot API endpoint (defaults to `https://api.githubcopilot.com`) |
| `GITHUB_MODELS_ENDPOINT` | ⬜ | GitHub Models endpoint (alternative to Copilot API) |
| `ALLOWED_TELEGRAM_USERS` | ⬜ | Comma-separated Telegram user IDs allowed to use the bot (empty = all users) |
| `LOG_LEVEL` | ⬜ | Log verbosity: `debug`, `info`, `warn`, `error` (default: `info`) |
| `PORT` | ⬜ | HTTP port for the webhook listener (default: `3000`) |

> **Never commit `.env` to source control.** Use GitHub Actions secrets or a secrets manager for production.

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/kmkirk83/Telepilot.git
cd Telepilot

# 2. Install dependencies (if using Node.js)
npm install

# 3. Copy and populate environment variables
cp .env.example .env
# Edit .env with your tokens

# 4. Start in development mode (long-polling)
npm run dev
```

For Python-based deployments, replace the npm commands with:

```bash
pip install -r requirements.txt
python -m telepilot
```

---

## Docker / Deployment

### Build the image

```bash
docker build -t telepilot:latest .
```

### Run with Docker

```bash
docker run -d \
  --name telepilot \
  --env-file .env \
  -p 3000:3000 \
  telepilot:latest
```

### Docker Compose

```yaml
version: "3.9"
services:
  telepilot:
    image: telepilot:latest
    env_file: .env
    ports:
      - "3000:3000"
    restart: unless-stopped
```

### Cloud deployment options

| Platform | How to deploy |
|---|---|
| **Railway / Render** | Connect the GitHub repo; set env vars in the dashboard |
| **Fly.io** | `fly launch` + set secrets with `fly secrets set` |
| **AWS ECS / GCP Cloud Run** | Push the Docker image and configure env vars |
| **Self-hosted VPS** | Use Docker Compose above with a reverse proxy (nginx/Caddy) |

---

## GitHub Action Usage

Telepilot ships a reusable GitHub Action that lets you query Copilot from any workflow:

```yaml
- name: Ask Copilot
  uses: kmkirk83/Telepilot@v1
  with:
    prompt: "Summarise the changes in this PR"
    github-token: ${{ secrets.GITHUB_TOKEN }}
    telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
```

### Multi-repository example

```yaml
- name: Ask Copilot across repos
  uses: kmkirk83/Telepilot@v1
  with:
    prompt: "Summarise release readiness"
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repo-config: |
      acme/api|api|main|Backend release status
      acme/web|web|main|Frontend release status
    target-repos: all
```

### Autocomplete example

```yaml
- name: Suggest repository aliases
  id: suggest-repos
  uses: kmkirk83/Telepilot@v1
  with:
    prompt: "unused when autocomplete is set"
    github-token: ${{ secrets.GITHUB_TOKEN }}
    repo-config: |
      acme/api|api|main|Backend release status
      acme/web|web|main|Frontend release status
    repo-autocomplete-query: ap
```

See [`action.yml`](action.yml) for the full list of inputs and outputs.

---

## Multi-Repository Orchestration

Use `repo-config` to register repositories in `owner/name|alias|branch|context` format. Separate entries with newlines or semicolons.

- `target-repos: all` fans out a prompt across every configured repo.
- `target-repos: api,web` limits execution to specific aliases.
- `repo-autocomplete-query` returns the `autocomplete` output instead of sending a Copilot request.
- Unknown aliases fail with suggestion text based on configured repositories.

Current runtime behavior is scaffolded for orchestration and prompt construction so workflows can standardize multi-repo targeting before live per-repo API integration is added.

---

## Security & Secrets Handling

- All secrets (tokens, webhook secrets) must be stored in **GitHub Actions secrets** (`Settings → Secrets and variables → Actions`) or an external secrets manager; never hard-code them.
- Set `TELEGRAM_WEBHOOK_SECRET` and validate it on every incoming webhook request to prevent spoofing.
- Restrict the bot to known user IDs using `ALLOWED_TELEGRAM_USERS` to avoid unauthorised access to Copilot.
- Use short-lived GitHub App installation tokens where possible rather than long-lived PATs.
- The Docker image is built from a minimal base; run as a non-root user in production.
- Review the [SECURITY.md](SECURITY.md) policy for reporting vulnerabilities.

---

## Troubleshooting

### Bot does not respond
- Confirm `TELEGRAM_BOT_TOKEN` is correct and the bot is started.
- If using webhooks, verify the `TELEGRAM_WEBHOOK_URL` is publicly reachable over HTTPS and the certificate is valid.
- Switch to long-polling (remove `TELEGRAM_WEBHOOK_URL`) to test without a public URL.

### GitHub API errors
- Ensure `GITHUB_TOKEN` has the required `copilot` or `models` scope.
- Check rate limits — GitHub Copilot API has per-user quotas.

### Docker container exits immediately
- Run `docker logs telepilot` to inspect startup errors.
- Verify that `.env` is present and all required variables are set.

### Webhook signature validation fails
- Ensure `TELEGRAM_WEBHOOK_SECRET` in `.env` matches the secret used when registering the webhook with Telegram.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

---

## Sponsorship & Support

Telepilot is **free and open source** (MIT). The core connector will always be self-hostable at no cost.

If Telepilot saves you time or helps your team, please consider:

| Channel | Link |
|---|---|
| ⭐ GitHub Sponsors | [github.com/sponsors/kmkirk83](https://github.com/sponsors/kmkirk83) |
| 💛 Open Collective | [opencollective.com/telepilot](https://opencollective.com/telepilot) |
| 🤝 Paid support / consulting | See [SUPPORT.md](SUPPORT.md) |

Sponsorships go directly toward maintenance, infrastructure, and future development.

For teams that want professional help deploying Telepilot securely, or a future **managed hosted version** (no servers required), see the [monetization strategy](MONETIZATION.md) and [pricing tiers](docs/pricing.md) documents for the full roadmap.

> **Hosted and enterprise tiers are not yet available.** The documents describe the planned approach and what signals will trigger their development. Ship free first — let demand decide.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full list of changes.

---

## Marketplace Publication Checklist

The repository is fully prepared for GitHub Marketplace publication. The following steps **must be completed in the GitHub UI** by the repository owner after this PR is merged:

### For GitHub Actions Marketplace

- [ ] Ensure the repository has a valid `action.yml` at the root (already added ✅).
- [ ] Ensure the repository has a valid `LICENSE` file (already added ✅).
- [ ] Create a versioned release (e.g. `v1.0.0`) via **GitHub Releases**.
- [ ] Go to **Repository → Settings → (scroll to) GitHub Marketplace** and click **"List this action on the GitHub Marketplace"**.
- [ ] Fill in the marketplace listing: name, description, category, and icon.
- [ ] Submit for review (GitHub reviews within ~2 business days).

### For GitHub App / Bot Marketplace

- [ ] Register the Telegram-connected service as a **GitHub App** via **GitHub Developer Settings → GitHub Apps → New GitHub App**.
- [ ] Configure the App with the permissions documented in [SECURITY.md](SECURITY.md).
- [ ] In the GitHub App settings, enable **"Make this app public"**.
- [ ] Enable **"List this app on the GitHub Marketplace"** in the App settings.
- [ ] Provide a pricing plan (free tier is sufficient for initial listing).
- [ ] Submit the listing for GitHub's review.

### General pre-publication checks

- [ ] All repository documentation is complete (`README`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `SUPPORT.md`).
- [ ] The default branch is `main` and the CI workflow passes.
- [ ] No secrets, tokens, or credentials are committed to the repository.
- [ ] The `.env.example` file covers all required configuration.

---

## License

This project is licensed under the [MIT License](LICENSE).

