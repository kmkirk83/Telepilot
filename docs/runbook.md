# Telepilot v0 Operational Runbook

## Operating Model

Telepilot v0 has no independently deployed process, database, webhook endpoint, queue, or health route. It executes as part of the calling GitHub Actions job. Operational investigation begins with the workflow run, the action outputs, and the GitHub Actions secret configuration.

## Validate Before Release

Run the deterministic local checks before creating a pull request:

```bash
bash tests/run-action.test.sh
bash -n scripts/run-action.sh
bash -n tests/run-action.test.sh
```

The repository CI validates action metadata, runs ShellCheck, executes the deterministic contract tests, scans for secrets, and checks release-tag behavior. Before publishing a release, run a private workflow using a non-production provider credential. If Telegram or Clarion delivery will be advertised, verify each enabled optional integration separately with test destinations and secrets.

## Workflow Readiness Checklist

| Check | Expected result | Action if not met |
|---|---|---|
| `api-key` secret | Present and available to the job. | Create or correct the GitHub Actions secret; do not place the credential in workflow text. |
| Provider configuration | `provider` is `openai` and the endpoint accepts OpenAI-compatible chat-completions requests. | Use the default endpoint or validate the compatible replacement in a private workflow. |
| Prompt/context | Both are within the documented limits and contain no prohibited data. | Reduce text and remove credentials, source code, or customer data that should not reach the provider. |
| Telegram relay | Both required fields are set and the target passes any allowlist. | Correct the chat ID/allowlist mismatch before retrying. |
| Clarion event | Endpoint, secret, and organization ID are all set only when desired. | Keep `clarion-event-required` false until the event sink has been validated. |

## Common Incidents

### Provider request failure

The action emits `::error::Provider request failed.` and, by default, fails the step. Confirm the provider credential and endpoint without printing either value. Review the prompt and context size; then retry with a minimal non-sensitive prompt in a private workflow. Do not set `fail-on-error: "false"` to conceal a production dependency failure.

### Empty provider response

The provider returned a successful response shape without a text completion. Record the `request-id`, preserve the workflow run, and retry with a minimal prompt. If the behavior continues, treat the chosen endpoint/model pairing as unsupported until it has been validated.

### Telegram delivery rejected

A configured Telegram target that is absent from `telegram-allowed-chat-ids` is intentionally rejected before any provider call. Correct the declared chat ID or allowlist. For a delivery error after response generation, verify the bot token and chat permissions through a private test workflow. Telepilot does not accept inbound Telegram messages and does not use webhooks.

### Clarion event delivery failed

When `clarion-event-required` is false, the primary provider output remains available and `clarion-event-status` reports `failed`. Confirm that the event endpoint, HMAC secret, and Clarion organization ID are all configured. Ensure that Clarion has the same HMAC secret and that its database migration has been applied. Only set the event as required after a private end-to-end verification.

## Secret Rotation

Keep API keys, Telegram bot tokens, and Clarion HMAC secrets only in GitHub Actions secrets or another approved secret manager. Rotate any value exposed to logs, committed to a repository, shared in an unencrypted channel, or used by a departing collaborator. Rotation requires changing the secret at both ends of the Clarion event integration and validating a new private workflow run.
