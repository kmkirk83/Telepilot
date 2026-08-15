# Telepilot

> **A bounded GitHub Action for AI workflow output, optional authorized Telegram relay, and optional signed Clarion completion events.**

[![CI](https://github.com/kmkirk83/Telepilot/actions/workflows/ci.yml/badge.svg)](https://github.com/kmkirk83/Telepilot/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What Telepilot v0 Does

Telepilot accepts a caller-supplied text prompt and optional text context in a GitHub Actions workflow, forwards it to one explicit OpenAI-compatible chat-completions endpoint, and exposes the normalized result as an action output. It can optionally relay that result to a single authorized Telegram chat. It can also send a one-way, HMAC-signed metadata summary to Clarion’s control plane.

| Capability | v0 status | Boundary |
|---|---:|---|
| OpenAI-compatible chat completion | Implemented | The provider is explicitly `openai`; credentials come from GitHub Actions secrets. |
| Workflow output | Implemented | Response, provider, request ID, Telegram message ID, and Clarion event status are written to `GITHUB_OUTPUT`. |
| Telegram relay | Implemented | Disabled by default; requires a bot token and chat ID, and supports a strict chat-ID allowlist. |
| Clarion event | Implemented | Outbound-only and HMAC-signed; it sends metadata and a response digest, never prompt text, response text, source code, or credentials. |
| Hosted Telegram bot or webhook service | Not implemented | Do not configure Telegram webhooks or long-polling for Telepilot v0. |
| GitHub Copilot or GitHub Models adapter | Not implemented | Do not assume a GitHub-issued token can call an AI endpoint through this action. |
| Repository crawling or code execution | Not implemented | Supply only the exact text context the workflow is willing to disclose. |

## Quick Start

Add a workflow similar to the following. Store every sensitive value in repository or organization secrets.

```yaml
name: Telepilot release summary

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  summarize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate a release summary
        id: telepilot
        uses: kmkirk83/Telepilot@v0
        with:
          prompt: "Write a concise release summary from the supplied context."
          context: ${{ github.event.repository.full_name }}
          provider: openai
          api-key: ${{ secrets.OPENAI_API_KEY }}
          model: gpt-4o-mini

      - name: Show response
        run: echo "${{ steps.telepilot.outputs.response }}"
```

The `context` input is deliberately caller-controlled. Before providing it, remove source code, customer data, credentials, internal URLs, or other material that the selected AI provider should not receive.

## Optional Telegram Relay

A Telegram relay is disabled unless both `telegram-bot-token` and `telegram-chat-id` are supplied. An allowlist should be used in every shared repository or organization workflow.

```yaml
      - name: Generate and relay
        uses: kmkirk83/Telepilot@v0
        with:
          prompt: "Summarize the deployment result."
          api-key: ${{ secrets.OPENAI_API_KEY }}
          telegram-bot-token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          telegram-chat-id: ${{ secrets.TELEGRAM_CHAT_ID }}
          telegram-allowed-chat-ids: ${{ secrets.TELEGRAM_ALLOWED_CHAT_IDS }}
```

Telepilot sends plain text rather than Markdown, truncates the Telegram body to the platform-safe v0 limit, and fails safely if a configured chat is not allowlisted.

## Optional Clarion Event

Clarion integration is outbound-only. Telepilot posts a signed summary after execution; the summary contains the action version, request ID, provider, outcome, duration, and response digest. Clarion cannot use this route to instruct Telepilot to perform another action.

```yaml
      - name: Generate and record the result
        uses: kmkirk83/Telepilot@v0
        with:
          prompt: "Summarize this completed workflow."
          api-key: ${{ secrets.OPENAI_API_KEY }}
          clarion-event-endpoint: ${{ secrets.CLARION_TELEPILOT_EVENT_ENDPOINT }}
          clarion-event-secret: ${{ secrets.CLARION_TELEPILOT_EVENT_SECRET }}
          clarion-organization-id: ${{ secrets.CLARION_ORGANIZATION_ID }}
          clarion-event-required: "false"
```

Set `clarion-event-required` to `true` only when the workflow must fail if audit-event recording is unavailable. Otherwise, event delivery failure is visible in the `clarion-event-status` output and workflow log without masking the primary result.

## Inputs and Outputs

| Input | Required | Default | Purpose |
|---|---:|---|---|
| `prompt` | Yes | — | Text prompt, limited to 12,000 characters. |
| `provider` | No | `openai` | v0 supports `openai` only. |
| `api-key` | Yes | — | Provider credential from GitHub Actions secrets. |
| `api-endpoint` | No | OpenAI chat-completions endpoint | OpenAI-compatible chat-completions endpoint. |
| `model` | No | `gpt-4o-mini` | Provider model identifier. |
| `context` | No | Empty | Caller-supplied text context, limited to 24,000 characters. |
| `telegram-bot-token`, `telegram-chat-id` | No | Empty | Enables optional Telegram relay only when both are set. |
| `telegram-allowed-chat-ids` | No | Empty | Comma-separated Telegram chat allowlist. |
| `clarion-event-endpoint`, `clarion-event-secret`, `clarion-organization-id` | No | Empty | Enables the optional signed Clarion completion event only when all three are set. |
| `clarion-event-required` | No | `false` | Determines whether failed enabled-event delivery fails the action. |
| `fail-on-error` | No | `true` | Determines whether provider and authorized-delivery errors fail the action. |

| Output | Meaning |
|---|---|
| `response` | Normalized provider response text. |
| `provider` | Provider adapter that generated the response. |
| `request-id` | Non-secret correlation ID for troubleshooting. |
| `telegram-message-id` | Set when optional Telegram delivery succeeds. |
| `clarion-event-status` | `disabled`, `delivered`, or `failed`. |

## Security Model

Telepilot has no durable service process and no inbound webhook. It runs only inside the calling GitHub Actions job. The action does not print API keys, bot tokens, HMAC secrets, authorization headers, prompt text, or response text in error messages. It writes only the declared, non-secret outputs.

The caller remains responsible for controlling which workflow events can reach the action and what context is provided to an external AI provider. In particular, do not run Telepilot with trusted secrets on untrusted pull-request code.

## Local Validation

The deterministic contract tests use a local fake `curl` binary and never call a provider, Telegram, or Clarion.

```bash
bash tests/run-action.test.sh
bash -n scripts/run-action.sh
```

The GitHub Actions workflow also validates action metadata, lints the action runtime with ShellCheck, runs the contract tests, scans for committed secrets, and updates a major-version tag only after release validation succeeds.

## Release Gate

A public `v0.1.0` release requires a clean CI run, a successful test against a real provider credential in a private repository, verified Telegram delivery to an allowlisted test chat when that feature is enabled, and confirmation that the Clarion event endpoint accepts the signed metadata-only payload. The full contract is documented in [`docs/v0-action-contract.md`](docs/v0-action-contract.md).

## License

Telepilot is licensed under the [MIT License](LICENSE).
