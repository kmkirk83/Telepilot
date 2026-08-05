# Telepilot Operational Runbook

## Start locally

```bash
npm install
cp .env.example .env
npm run dev
```

## Validate locally

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Readiness checks

- `GET /health/live` should return `{ "status": "ok" }`
- `GET /health/ready` should report queue and dead-letter counts

## Common incidents

### Invalid webhook secret

- Symptom: `401 AUTHENTICATION_FAILED`
- Action: verify `TELEGRAM_WEBHOOK_SECRET` and Telegram webhook configuration

### Tenant auth failures

- Symptom: `401 AUTHENTICATION_FAILED` on `/v1/messages`
- Action: rotate and redistribute the tenant API key in `API_KEYS`

### Dead-letter growth

- Symptom: readiness endpoint reports increasing `deadLetterCount`
- Action: verify provider credentials, inspect correlation IDs in logs, and remediate the underlying failure before accepting new traffic

### Rate limiting

- Symptom: `429 RATE_LIMIT_EXCEEDED`
- Action: raise `RATE_LIMIT_MAX_REQUESTS` or increase horizontal capacity after replacing in-memory limiter/state

## Secret management and rotation

- Use platform-managed secret stores for API keys and provider credentials.
- Rotate Telegram, provider, and tenant keys on a regular schedule.
- Never commit `.env` files or raw credentials.
