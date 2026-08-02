# Telepilot — Pricing & Feature Tiers

This document describes what is free forever, what may become a paid hosted offering, and what the premium enterprise tier looks like if demand warrants it.

> **The self-hosted connector is always free and MIT-licensed.** Paid tiers are for teams that want convenience, managed infrastructure, or enterprise controls — not for gating the core functionality.

---

## Free — Self-Hosted (always free)

Everything in this repository.

| Feature | Included |
|---|---|
| Telegram ↔ GitHub Copilot connector | ✅ |
| GitHub Action mode | ✅ |
| Single-user and multi-user self-hosted deployment | ✅ |
| Webhook and long-polling support | ✅ |
| `ALLOWED_TELEGRAM_USERS` access control | ✅ |
| Docker / Docker Compose packaging | ✅ |
| All documentation and architecture guides | ✅ |
| Community support (GitHub Issues & Discussions) | ✅ |
| MIT licence — self-host, fork, modify, redistribute | ✅ |

**How to deploy:** follow [README.md](../README.md#local-development-setup) and [README.md#docker--deployment](../README.md#docker--deployment).

---

## Sponsored — GitHub Sponsors / Open Collective

Supporters who sponsor the project receive acknowledgement and priority community support.

| Tier | Monthly | Benefits |
|---|---|---|
| ☕ Coffee | $5 | Name in sponsors section of README |
| 🚀 Supporter | $25 | Priority issue triage (≤ 7 days) |
| 🏢 Organisation | $100 | Logo in README + priority issue triage |

**Activate:** [github.com/sponsors/kmkirk83](https://github.com/sponsors/kmkirk83) · [opencollective.com/telepilot](https://opencollective.com/telepilot)

---

## Paid Support & Consulting (on demand)

For teams that want professional help deploying or customising Telepilot.

| Engagement | Price (indicative) | Scope |
|---|---|---|
| Deployment review | $200–$500 (one-time) | Config, secrets, and network review |
| Secure setup session | $150 / hr | Live guided deployment |
| Monthly support retainer | $500–$1,500 / month | 48 hr response + minor feature requests |

Contact via [SUPPORT.md](../SUPPORT.md) or GitHub Sponsors one-time sponsorship.

---

## Hosted / Managed *(future — not yet available)*

> **Build only when ≥ 5 users explicitly request it.** See [MONETIZATION.md](../MONETIZATION.md#measuring-demand-before-investing).

A managed version where Telepilot runs in our infrastructure — no servers, no Docker, no secrets management for the customer.

| Plan | Monthly (indicative) | Users | Audit log retention | SLA |
|---|---|---|---|---|
| Starter | $19 | 1 bot / 1 user | 7 days | — |
| Team | $49 | Up to 10 users | 30 days | 99 % |
| Business | $149 | Unlimited users | 90 days | 99.5 % |
| Enterprise | Custom | Custom | Custom | 99.9 % + dedicated support |

### What the hosted tier adds (vs self-hosted)

- Zero-infrastructure setup: web UI to connect your Telegram bot and GitHub App.
- Automatic updates and security patches.
- Uptime monitoring and restart-on-failure.
- Audit log: who asked what, when.
- Multi-user workspace management.
- SSO / SAML *(Enterprise only)*.
- Usage analytics dashboard *(Team and above)*.

---

## Premium Enterprise Features *(future — roadmap)*

| Feature | Tier |
|---|---|
| SSO / SAML | Enterprise |
| Org-level access controls | Business+ |
| Advanced context management (auto-inject repo/branch/PR) | Business+ |
| Usage analytics with cost attribution | Team+ |
| Custom model routing (on-prem or Azure OpenAI) | Enterprise |
| Dedicated Slack/Teams support channel | Enterprise |
| Guaranteed uptime SLA with credits | Business+ |
| Compliance pack (SOC 2, GDPR DPA) | Enterprise |

---

## FAQ

**Can I use the free version in a commercial product?**
Yes. The MIT licence permits commercial use. You may not resell the connector itself as a SaaS without building substantial additional value on top of it, and you must comply with GitHub Copilot and Telegram Bot API terms.

**Will the core connector ever become paid?**
No. The MIT-licenced self-hosted connector will always be free.

**How do I know when the hosted tier is available?**
Watch the repository and enable GitHub releases notifications. An announcement will be posted in GitHub Discussions when the hosted tier launches.

**I need enterprise features now — what should I do?**
Open a GitHub Discussion describing your requirements. If there is sufficient demand, it will be prioritised. In the meantime, consulting engagements can cover custom deployments.
