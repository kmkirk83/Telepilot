# Telepilot Architecture

## Connector flow

1. Telegram sends an update to `POST /v1/webhook/telegram/:tenantId`.
2. Telepilot resolves the tenant from the trusted route binding and validates that tenant's Telegram secret-token header.
3. The webhook is normalized into a canonical internal message.
4. The service performs idempotency checks and enqueues async work.
5. The router dispatches to the tenant-selected provider adapter (`copilot`, `openai`, or `mcp`).
6. Session state is stored for retrieval via `GET /v1/sessions/:id`.

## Modules

- `src/controllers`: HTTP-facing controllers
- `src/routes`: versioned API router under `/v1`
- `src/services`: auth, normalization, routing, session, webhook orchestration
- `src/providers`: provider adapter framework and stubs
- `src/config`: strict environment parsing and tenant bootstrapping
- `src/infra`: queue, retry, dead-letter, idempotency, error classes
- `src/observability`: structured logging, metrics hooks, tracing scaffold

## Reliability model

- Fast webhook acknowledgement using HTTP `202`
- Queue-based async processing
- Retry with capped linear backoff (`QUEUE_BACKOFF_MS * attempt`)
- Dead-letter retention for jobs that exceed `QUEUE_MAX_RETRIES`
- Deterministic JSON error responses with correlation IDs

## Multi-tenant model

- Tenants are configured from env-driven maps (`API_KEYS`, `TENANT_PROVIDERS`)
- API access is scoped via tenant API keys
- Production startup rejects placeholder API keys and empty webhook secrets
- OAuth scaffolding is modeled on the tenant configuration for future install flows

## Security assumptions

Telegram webhook validation uses the Bot API secret-token header because Telegram does not provide a universal request-body signature for this webhook mode. Production startup fails closed if the webhook secret is unset or API keys are left on the development placeholder. External tenant deployments should terminate TLS at the edge and manage secrets through environment injection or a dedicated secret manager.
