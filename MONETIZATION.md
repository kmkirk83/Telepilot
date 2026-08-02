# Telepilot — Monetization Strategy

This document outlines the current and planned approach to sustaining Telepilot as an open-source project and, if demand warrants it, evolving into a commercial offering.

> **Philosophy: ship free and open first. Let real usage pull you into monetization.**

---

## Table of Contents

- [Guiding Principle](#guiding-principle)
- [Tier 1 — Free & Open Core (permanent)](#tier-1--free--open-core-permanent)
- [Tier 2 — GitHub Sponsors & Open Collective](#tier-2--github-sponsors--open-collective)
- [Tier 3 — Paid Priority Support & Consulting](#tier-3--paid-priority-support--consulting)
- [Tier 4 — Hosted / Managed Service (future)](#tier-4--hosted--managed-service-future)
- [Tier 5 — Premium Enterprise Features (future)](#tier-5--premium-enterprise-features-future)
- [B2B Angle](#b2b-angle)
- [Adjacent Products & Lead Magnets](#adjacent-products--lead-magnets)
- [Measuring Demand Before Investing](#measuring-demand-before-investing)
- [Legal & Terms-of-Service Checklist](#legal--terms-of-service-checklist)
- [Practical Roadmap](#practical-roadmap)

---

## Guiding Principle

> **The connector stays free and open. Monetization comes from surrounding services, not from locking the core.**

Early aggressive productization of a connector that sits on top of Copilot and the Telegram Bot API is unlikely to return meaningful revenue at low adoption. The better play is:

1. Ship the open-source connector. Attract real users.
2. Measure what they actually pay for (hosting convenience, support, org controls).
3. Build only the paid layer that demand clearly justifies.
4. Keep the MIT core intact — it drives trust, stars, and organic discovery.

---

## Tier 1 — Free & Open Core (permanent)

Everything in this repository is, and will remain, MIT-licensed and freely self-hostable.

| What is free | Why |
|---|---|
| The Telegram ↔ Copilot connector | Core value proposition; keeps trust |
| Single-user self-hosted deployment | Lowest friction for adoption |
| GitHub Action mode | Direct integration into existing workflows |
| All documentation and guides | Reduces support load |
| Bug fixes and security patches | Table stakes for any open-source project |

**Never** put the following behind a paywall:
- The ability to self-host
- Bug fixes or security updates
- The MIT licence or its rights

---

## Tier 2 — GitHub Sponsors & Open Collective

**Status: ready to activate (low effort, low risk)**

### GitHub Sponsors

The `.github/FUNDING.yml` file is already configured. To activate:

1. Go to **github.com/sponsors/kmkirk83** and complete the onboarding form.
2. Set up at least two tiers:

| Tier | Monthly | What supporters get |
|---|---|---|
| ☕ Coffee | $5 | Name in `CHANGELOG.md` / README sponsors section |
| 🚀 Supporter | $25 | Priority issue triage (best-effort, within 7 days) |
| 🏢 Organisation | $100 | Logo in README + priority issue triage |

3. Add a `BACKERS.md` or a sponsors section to `README.md` once the first sponsor joins.

### Open Collective

Open Collective provides transparent financial tracking — good for demonstrating project health to potential enterprise customers.

1. Create a collective at **opencollective.com/telepilot**.
2. Link it in `.github/FUNDING.yml` (already set to `telepilot`).
3. Use Open Collective for any shared hosting costs, domain renewals, or paid tooling.

**Expected revenue: modest** ($0–$500/month at early stage). Treat this as community signal, not income.

---

## Tier 3 — Paid Priority Support & Consulting

**Status: activate when inbound requests arrive (zero infrastructure needed)**

Once the project has real users, some will prefer to pay for guaranteed help rather than wait on the public issue tracker. Offer this informally first, then formalise it if demand is consistent.

### Offering

| Package | Price (indicative) | What is included |
|---|---|---|
| Deployment review | $200–$500 one-time | Review a team's deployment config, secrets handling, and network setup |
| Secure setup session | $150/hr | Pair programming / live call to configure Telepilot for a team |
| Retainer support | $500–$1,500/month | Guaranteed 48 hr response on issues + minor feature requests |

### How to advertise this

- Add a brief **"Need help deploying?"** note to `SUPPORT.md` and `README.md` linking to a contact page or email.
- Use GitHub Sponsors "one-time" sponsorships as a payment mechanism until a proper invoicing system is set up.

**Expected revenue: $500–$5,000/year** depending on enterprise interest. High margin, low effort.

---

## Tier 4 — Hosted / Managed Service (future)

**Status: build only if self-hosting pain drives sustained demand**

A managed version means the customer never touches servers. They connect their Telegram bot and GitHub token via a web UI, and Telepilot runs for them.

### What it provides

- Zero-infrastructure setup: no Docker, no VPS, no secrets management.
- Automatic updates, uptime monitoring, and restart-on-failure.
- A web dashboard to manage authorised Telegram users per workspace.
- Audit log: who asked what, when, with a 30/90-day retention option.
- Guaranteed uptime SLA (e.g. 99.5 % monthly).

### Pricing model (indicative — validate before building)

| Plan | Monthly | Users | Retention | SLA |
|---|---|---|---|---|
| Starter | $19 | 1 Telegram bot | 7 days | None |
| Team | $49 | Up to 10 users | 30 days | 99 % |
| Business | $149 | Unlimited users | 90 days | 99.5 % |
| Enterprise | Custom | Custom | Custom | 99.9 % + support |

### Build only when

- [ ] ≥ 50 users have deployed the self-hosted version.
- [ ] ≥ 5 users have explicitly asked for a managed option in issues or discussions.
- [ ] A competitor has launched a paid Telegram-Copilot connector, validating the market.

### Technical prerequisites

- Multi-tenant architecture (isolated bot processes or namespace separation).
- OAuth flow for connecting a GitHub App (do not store long-lived PATs).
- Stripe or Paddle integration for billing.
- GDPR/data processing compliance for EU customers (see [Legal checklist](#legal--terms-of-service-checklist)).

---

## Tier 5 — Premium Enterprise Features (future)

**Status: roadmap item — build after hosted tier proves revenue**

These features are relevant only to organisations with ≥ 10 users and compliance requirements.

| Feature | Why enterprises pay for it |
|---|---|
| **SSO / SAML integration** | Centralised identity, audit requirement |
| **Org-level access controls** | Manage which employees can use the bot |
| **Advanced context management** | Inject repo/branch/PR context automatically |
| **Usage analytics dashboard** | Cost attribution, team productivity metrics |
| **Guaranteed uptime SLAs** | Required by procurement teams |
| **Custom model routing** | Route sensitive prompts to on-prem models |
| **Dedicated support channel** | Slack/Teams direct line to maintainer |

Do not build any of this speculatively. Each feature should have at least 3 paying customers requesting it before development begins.

---

## B2B Angle

**Target buyer: small engineering teams and agencies (2–20 engineers) using Copilot for on-call debugging or mobile code review.**

The pain point: engineers on call from a phone cannot easily access Copilot through VS Code. A Telegram bot means Copilot is accessible from anywhere with no IDE required.

### Sales approach

- Direct outreach is not worth the effort at early stage.
- Instead, write content targeting the pain point: blog posts, short demos, GitHub README optimised for "Copilot on mobile" searches.
- Let inbound interest drive discovery.
- For serious B2B inquiries, offer a **30-day free trial of the hosted tier** before committing to a paid plan.

### Packaging for B2B

- A Docker Compose reference deployment with Traefik, SSL, and a secrets manager (Vault / AWS Secrets Manager) pre-configured.
- A security hardening guide specifically for enterprise deployments (already started in `SECURITY.md`).
- A one-page PDF datasheet explaining permissions, data flows, and compliance posture.

---

## Adjacent Products & Lead Magnets

Telepilot can serve as a free lead magnet for higher-value offers:

| Product | Description | Monetisation |
|---|---|---|
| **"Copilot in Telegram" course** | Video walkthrough of deploying Telepilot + building on top of it | One-time purchase ($49–$149) |
| **Mobile AI Coding Agent** | A broader service (not Copilot-specific) for mobile debugging via chat | Subscription or usage-based |
| **AI tooling consulting** | Use Telepilot demos to establish credibility for broader AI integration work | Hourly / retainer |
| **Copilot extension ecosystem** | Build complementary GitHub Copilot extensions and cross-promote | Marketplace listing fees or sponsorships |

These are **optional future directions**, not immediate priorities.

---

## Measuring Demand Before Investing

Track these signals before committing to any paid tier. All are visible in the GitHub Insights tab and, once deployed, from server logs.

| Signal | Action threshold |
|---|---|
| GitHub stars | > 200 stars: list on Awesome lists / Product Hunt |
| Unique cloners / week | > 50/week: write "Getting Started" content |
| Issues requesting hosted version | ≥ 5 issues: prototype hosted MVP |
| Issues requesting enterprise features | ≥ 3 similar requests: add to roadmap |
| Sponsor sign-ups | First sponsor: write thank-you update + BACKERS section |
| Consulting inquiries | First inbound email: formalise offering in `SUPPORT.md` |

---

## Legal & Terms-of-Service Checklist

**Complete this before any commercial offering is launched.**

- [ ] **GitHub Copilot Terms of Service** — Review whether reselling access to Copilot responses or building a commercial product on top of the API is permitted. See: [GitHub Copilot Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features#github-copilot).
- [ ] **GitHub Models Terms** — If using GitHub Models endpoint, review the [GitHub Models Terms of Use](https://docs.github.com/en/github-models/prototyping-with-ai-models/responsible-use-of-github-models).
- [ ] **Telegram Bot API Terms** — Confirm that the Telegram Bot API terms permit commercial use of bot infrastructure. See: [Telegram API Terms of Service](https://core.telegram.org/api/terms).
- [ ] **Data processing / GDPR** — If storing Telegram message content or GitHub tokens for a hosted service, a Data Processing Agreement (DPA) and privacy policy are required for EU users.
- [ ] **Copilot response redistribution** — Do not cache, re-serve, or resell raw Copilot API responses to third parties. Responses are for end-user consumption.
- [ ] **Export controls** — AI services may be subject to export control regulations in certain jurisdictions.
- [ ] **EULA for hosted tier** — Draft a service-level Terms of Service before accepting any paying customers.

> ⚠️ **This is not legal advice.** Consult a lawyer familiar with SaaS and AI API terms before launching any paid tier.

---

## Practical Roadmap

```
Now         Ship free, open-source connector. Focus on quality and docs.
            ↓
Month 1-3   Activate GitHub Sponsors (zero effort). Watch usage metrics.
            ↓
Month 3-6   If consulting requests arrive, formalise support offering in SUPPORT.md.
            ↓
Month 6-12  If ≥ 5 users ask for hosted version AND legal review is clear,
            prototype a single-tenant hosted MVP.
            ↓
Year 1+     If hosted MVP shows paying customers, invest in multi-tenant
            architecture and enterprise features.
```

The most important thing right now is **not** to spend time on billing, Stripe integration, or marketing copy. It is to make the connector genuinely useful, well-documented, and easy to deploy.

Stars and real usage are the only honest signal of whether productization is worth pursuing.
