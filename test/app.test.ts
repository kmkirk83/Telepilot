import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

function makeApp() {
  return createApp(
    loadEnv({
      NODE_ENV: 'test',
      API_KEYS: 'tenant-default:test-key,tenant-openai:openai-key',
      TENANT_PROVIDERS: 'tenant-default:copilot,tenant-openai:openai',
      TELEGRAM_WEBHOOK_SECRET: 'secret',
      RATE_LIMIT_MAX_REQUESTS: '1000'
    })
  );
}

describe('Telepilot connector API', () => {
  it('accepts telegram webhook and fast-acks', async () => {
    const app = makeApp();
    const response = await request(app)
      .post('/v1/webhook/telegram/tenant-default')
      .set('x-telegram-bot-api-secret-token', 'secret')
      .send({ update_id: 1001, message: { message_id: 10, text: 'hello', chat: { id: 55 }, from: { id: 7 } } });

    expect(response.status).toBe(202);
    expect(response.body.data).toEqual({ accepted: true, duplicate: false });

    await app.locals.queue.drain();
    const sessionResponse = await request(app)
      .get('/v1/sessions/55')
      .set('x-api-key', 'test-key');

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.data.messages[0].outputText).toContain('[copilot:tenant-default]');
  });

  it('rejects invalid api key', async () => {
    const app = makeApp();
    const response = await request(app)
      .post('/v1/messages')
      .set('x-api-key', 'bad-key')
      .send({ sessionId: 'abc', text: 'hello', idempotencyKey: 'msg-1' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
  });

  it('enforces idempotency for duplicate webhook updates', async () => {
    const app = makeApp();
    const payload = { update_id: 1001, message: { message_id: 10, text: 'hello', chat: { id: 55 }, from: { id: 7 } } };

    const first = await request(app)
      .post('/v1/webhook/telegram/tenant-default')
      .set('x-telegram-bot-api-secret-token', 'secret')
      .send(payload);
    const second = await request(app)
      .post('/v1/webhook/telegram/tenant-default')
      .set('x-telegram-bot-api-secret-token', 'secret')
      .send(payload);

    expect(first.body.data.duplicate).toBe(false);
    expect(second.body.data.duplicate).toBe(true);
  });

  it('treats equal telegram message ids from different chats as distinct', async () => {
    const app = makeApp();

    const first = await request(app)
      .post('/v1/webhook/telegram/tenant-default')
      .set('x-telegram-bot-api-secret-token', 'secret')
      .send({ update_id: 2001, message: { message_id: 10, text: 'hello', chat: { id: 55 }, from: { id: 7 } } });
    const second = await request(app)
      .post('/v1/webhook/telegram/tenant-default')
      .set('x-telegram-bot-api-secret-token', 'secret')
      .send({ update_id: 2002, message: { message_id: 10, text: 'hello again', chat: { id: 56 }, from: { id: 7 } } });

    expect(first.body.data.duplicate).toBe(false);
    expect(second.body.data.duplicate).toBe(false);
  });

  it('routes API messages based on tenant provider', async () => {
    const app = makeApp();
    const response = await request(app)
      .post('/v1/messages')
      .set('x-api-key', 'openai-key')
      .send({ sessionId: 'api-session', text: 'ship it', idempotencyKey: 'msg-2' });

    expect(response.status).toBe(202);
    await app.locals.queue.drain();
    const sessionResponse = await request(app)
      .get('/v1/sessions/api-session')
      .set('x-api-key', 'openai-key');

    expect(sessionResponse.body.data.messages[0].outputText).toContain('[openai:tenant-openai]');
  });

  it('serves health and openapi endpoints', async () => {
    const app = makeApp();
    const ready = await request(app).get('/health/ready');
    const spec = await request(app).get('/openapi.json');

    expect(ready.status).toBe(200);
    expect(spec.status).toBe(200);
    expect(spec.body.paths['/v1/messages']).toBeDefined();
  });
});
