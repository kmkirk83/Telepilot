# Telepilot v0 Architecture

## Scope

Telepilot v0 is a **composite GitHub Action**, not a hosted service. It runs inside the caller’s GitHub Actions job, processes only caller-supplied text, and has no inbound webhook, queue, database, durable memory, repository crawler, or remote-execution capability.

```text
GitHub Actions workflow
        │
        ├── explicit prompt + optional text context
        │
        ▼
Telepilot composite action
        │
        ├── OpenAI-compatible chat-completions request
        │        │
        │        ▼
        │    normalized text response ──► GITHUB_OUTPUT
        │        │
        │        ├── optional authorized Telegram relay
        │        │
        │        └── optional signed metadata-only Clarion event
        │
        ▼
workflow-controlled next step
```

## Runtime Components

| Component | Responsibility | Trust boundary |
|---|---|---|
| `action.yml` | Declares inputs, outputs, and the environment passed to the composite action. | It maps GitHub Actions expressions into process environment variables; secrets must originate from Actions secrets. |
| `scripts/run-action.sh` | Validates inputs, invokes the provider, writes approved outputs, performs optional delivery, and signs optional event summaries. | It never prints credentials or raw authorization headers. |
| Provider adapter | Sends one OpenAI-compatible chat-completions request for each action invocation. | It receives only the caller’s prompt and optional context. |
| Telegram relay | Sends a plain-text response to one configured, optional chat. | It requires both token and chat ID and honors an optional chat allowlist. |
| Clarion event sink | Records completion metadata for operational traceability. | Telepilot signs the payload with HMAC. The connection is outbound-only. |

## Input Controls

The action validates a 12,000-character prompt limit and a 24,000-character context limit before calling the provider. The provider identifier is allowlisted to `openai` in v0. Any provider error, invalid configuration, missing credential, or unauthorized Telegram target follows the `fail-on-error` policy, which defaults to failing the workflow step.

The action writes only the documented outputs. It does not expose credentials, raw headers, or structured provider payloads. The response is not automatically logged; workflow authors decide how to consume or display it.

## Telegram Boundary

Telegram is a delivery channel, not an inbound command channel. The action does not register a webhook, poll Telegram, or accept messages from Telegram users. When configured, it sends a maximum-length plain-text response to a single declared chat. If an allowlist is supplied, the declared target must match it exactly.

## Clarion Boundary

The optional Clarion event payload is HMAC-signed and contains the action version, request ID, provider identifier, outcome, duration, response digest, and an optional sanitized failure summary. It intentionally excludes prompt text, response text, source code, credentials, and user identifiers. Clarion may record the event as `TELEPILOT_EVENT`; it cannot command Telepilot through this integration.

## Operational Model

Telepilot has no persistent infrastructure. It inherits GitHub Actions’ lifecycle, logging, and secret-management model. The repository’s CI performs action-metadata validation, ShellCheck, deterministic contract testing, Markdown linting, and secret scanning. A release should not be created until a private workflow verifies the chosen provider and any enabled optional delivery path with non-production credentials.
