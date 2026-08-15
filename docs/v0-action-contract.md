# Telepilot v0 Action Contract

**Status:** Active implementation contract  
**Date:** 2026-08-14

## Product Boundary

Telepilot v0 is a composite GitHub Action that sends a caller-supplied, size-limited text prompt to one verified model-provider adapter and exposes the returned text as a workflow output. It may optionally relay that output to a single explicitly configured Telegram chat.

Telepilot is not a hosted multi-tenant service, a general Telegram bot, a repository crawler, an autonomous code agent, or an arbitrary remote-execution channel. Documentation and examples must not imply those capabilities.

## Inputs

| Input | Required | Rule |
|---|---:|---|
| `prompt` | Yes | Plain text, maximum 12,000 characters after any optional context is joined. |
| `provider` | Yes | An allowlisted adapter identifier. The initial supported adapter is the first adapter proven in GitHub Actions. |
| provider credential | Yes | Passed only through GitHub Actions secrets; never printed, placed in outputs, or sent to Telegram. |
| `context` | No | Plain text, maximum 24,000 characters. It must be supplied explicitly by the workflow caller. |
| `telegram-bot-token` | No | Enables delivery only when paired with `telegram-chat-id`. |
| `telegram-chat-id` | No | Must match the configured allowlist when an allowlist is present. |
| `fail-on-error` | No | Defaults to `true` for v0. Production workflows should not silently succeed after provider failure. |

## Outputs

| Output | Meaning |
|---|---|
| `response` | Normalized provider response text. Empty only when the action fails and `fail-on-error` is explicitly disabled. |
| `provider` | The adapter that produced the response. |
| `request-id` | A non-secret, action-generated correlation identifier for troubleshooting. |
| `telegram-message-id` | Present only if the optional Telegram delivery succeeds. |

## Required Runtime Behavior

1. Validate input sizes and incompatible configurations before a provider request begins.
2. Normalize provider success and error shapes without exposing credential values or raw authorization headers.
3. Write only approved outputs to `GITHUB_OUTPUT`.
4. Send Telegram messages only when both delivery inputs are configured and the target passes the allowlist rule.
5. Treat failed Telegram delivery as an explicit failure or warning according to the documented `fail-on-error` behavior.
6. Emit a small structured run summary that can later be sent to Clarion as a signed `TELEPILOT_EVENT`. The summary contains only action version, request identifier, provider identifier, outcome, duration, and an optional response digest; it contains no prompt, response body, credentials, repository source, or user identifiers.

## Clarion Integration Boundary

The first Telepilot release works independently. Optional Clarion integration is outbound-only: Telepilot can submit a signed completion summary to a configured Clarion event endpoint. Clarion records the event for operations and traceability but cannot use that endpoint to issue commands back to Telepilot.

## Release Gate

Telepilot may receive a public `v0.1.0` release only after all of the following are true:

- A documented provider adapter passes in a clean GitHub Actions run.
- Valid and invalid input behavior is covered by automated tests or deterministic validation fixtures.
- The action never logs secrets in success or error paths.
- A Telegram relay succeeds for an authorized test chat and fails safely for an unauthorized/missing configuration.
- The README, environment example, architecture document, and runbook describe only implemented behavior.
