# Telepilot

Production-ready, marketplace-capable Telegram connector platform for AI developer apps.

## Overview

Telepilot exposes a versioned Connector API that accepts Telegram webhook events or normalized message submissions, routes them to tenant-selected AI provider adapters, and tracks session state for downstream retrieval.

### Public endpoints

- `POST /v1/webhook/telegram`
- `POST /v1/messages`
- `GET /v1/sessions/:id`
- `GET /health/live`
- `GET /health/ready`
- `GET /openapi.json`

## Architecture

- **routes/controllers**: transport-facing Express handlers under `/src/routes` and `/src/controllers`
- **services**: auth, normalization, routing, webhook processing, session state
- **providers/adapters**: `copilot`, `openai`, `mcp` adapter contracts and implementations
- **config**: strict env validation and tenant bootstrap
- **infra**: in-memory queue, retry, DLQ, idempotency store, error classes
- **observability**: structured JSON logging, correlation IDs, metrics, tracing scaffold

Webhook ingest fast-acks with HTTP `202` and offloads dispatch to the async queue.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Production run

```bash
npm run build
npm run start
```

## Environment variables

See `.env.example` for the complete list. Core variables:

- `API_KEYS`: tenant-scoped API keys in `tenantId:key` format
- `TENANT_PROVIDERS`: tenant provider mapping in `tenantId:provider` format
- `TELEGRAM_WEBHOOK_SECRET`: validates Telegram webhook secret-token header
- `QUEUE_MAX_RETRIES`, `QUEUE_BACKOFF_MS`: retry and capped backoff settings
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`: basic rate limiting
- `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`: OAuth-ready scaffolding

## API usage examples

### Telegram webhook

```bash
curl -X POST http://localhost:3000/v1/webhook/telegram \
  -H 'content-type: application/json' \
  -H 'x-telegram-bot-api-secret-token: change-me' \
  -d '{
    "tenantId": "tenant-default",
    "message": {
      "message_id": 42,
      "text": "hello from telegram",
      "chat": { "id": 12345 },
      "from": { "id": 777 }
    }
  }'
```

### Normalized message submit

```bash
curl -X POST http://localhost:3000/v1/messages \
  -H 'content-type: application/json' \
  -H 'x-api-key: replace-with-strong-api-key' \
  -d '{
    "sessionId": "tenant-default-session-1",
    "text": "ship a summary",
    "idempotencyKey": "msg-001"
  }'
```

### Session retrieval

```bash
curl http://localhost:3000/v1/sessions/tenant-default-session-1 \
  -H 'x-api-key: replace-with-strong-api-key'
```

## Webhook setup

Configure your Telegram bot webhook to point to `/v1/webhook/telegram` and provide the same secret token as `TELEGRAM_WEBHOOK_SECRET`. Telegram does not sign payload bodies with an HMAC; Telepilot therefore validates the Bot API secret-token header and documents this assumption for review readiness.

## Deployment notes

- Run behind HTTPS in production.
- Store secrets in a secrets manager or deployment platform secret store.
- Replace in-memory queue/session/idempotency implementations with managed persistence for multi-instance deployments.
- Rotate tenant API keys and provider credentials regularly.

## Operations runbook

- `GET /health/live`: process liveness
- `GET /health/ready`: queue and dead-letter readiness snapshot
- Inspect structured JSON logs using correlation IDs from responses.
- Dead-letter growth indicates unrecoverable dispatch failures and should trigger replay or tenant credential checks.

## Troubleshooting

- **401 on `/v1/messages`**: verify `x-api-key` matches `API_KEYS`.
- **401 on webhook**: verify `x-telegram-bot-api-secret-token` matches `TELEGRAM_WEBHOOK_SECRET`.
- **429 responses**: adjust rate-limit environment settings for expected traffic.
- **Session not found**: ensure queued work has drained or provider dispatch completed.

## Security and privacy notes

- No credentials are hardcoded; all secrets are env-driven.
- Validate and rotate tenant/provider secrets regularly.
- Minimize retained message content and add persistence encryption before marketplace launch with external tenants.
- Review `SECURITY.md` for reporting guidance and operational expectations.

## CI and quality gates

GitHub Actions runs deterministic install, lint, typecheck, test, build, secret scanning, and marketplace metadata validation.

## Future optional work

- Replace in-memory infrastructure with Redis/SQS/Postgres-backed implementations.
- Implement full outbound provider clients and OAuth installation flow.
- Add persistence-backed replay tooling and admin surfaces.
