import express from 'express';
import helmet from 'helmet';
import { HealthController } from './controllers/health-controller.js';
import { MessageController } from './controllers/message-controller.js';
import { SessionController } from './controllers/session-controller.js';
import { WebhookController } from './controllers/webhook-controller.js';
import { buildTenants } from './config/tenants.js';
import type { AppEnv } from './config/env.js';
import { IdempotencyStore } from './infra/idempotency.js';
import { InMemoryQueue } from './infra/queue.js';
import { errorHandler } from './middleware/error-handler.js';
import { correlationMiddleware } from './middleware/correlation.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { createHttpLogger, createLogger } from './observability/logger.js';
import { InMemoryMetrics } from './observability/metrics.js';
import { NoopTracer } from './observability/tracing.js';
import { CopilotAdapter } from './providers/copilot-adapter.js';
import { McpAdapter } from './providers/mcp-adapter.js';
import { OpenAiAdapter } from './providers/openai-adapter.js';
import { AuthService } from './services/auth-service.js';
import { NormalizationService } from './services/normalization-service.js';
import { ProviderRegistry } from './services/provider-registry.js';
import { RouterService } from './services/router-service.js';
import { SessionStore } from './services/session-store.js';
import { WebhookService } from './services/webhook-service.js';
import { buildV1Router } from './routes/v1.js';
import { openApiSpec } from './openapi/spec.js';
import type { CanonicalMessage, TenantConfig } from './types/domain.js';

export function createApp(env: AppEnv) {
  const app = express();
  const logger = createLogger(env.LOG_LEVEL);
  const metrics = new InMemoryMetrics();
  const tracer = new NoopTracer();
  const tenants = buildTenants(env);
  const authService = new AuthService(tenants);
  const queue = new InMemoryQueue<{ message: CanonicalMessage; tenant: TenantConfig }>(
    env.QUEUE_MAX_RETRIES,
    env.QUEUE_BACKOFF_MS
  );
  const sessions = new SessionStore();
  const providers = new ProviderRegistry([new CopilotAdapter(), new OpenAiAdapter(), new McpAdapter()]);
  const routerService = new RouterService(providers, sessions);
  const webhookService = new WebhookService(queue, new IdempotencyStore(), routerService);
  const normalization = new NormalizationService();
  const healthController = new HealthController(queue);
  const messageController = new MessageController(normalization, webhookService);
  const sessionController = new SessionController(sessions);
  const webhookController = new WebhookController(normalization, webhookService, tenants, env.TELEGRAM_WEBHOOK_SECRET);

  app.locals.metrics = metrics;
  app.locals.tracer = tracer;
  app.locals.queue = queue;
  app.locals.sessions = sessions;
  app.locals.tenants = tenants;

  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(correlationMiddleware);
  app.use(createHttpLogger(logger));
  app.use(createRateLimiter(env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX_REQUESTS));
  app.use((req, res, next) => {
    const span = tracer.startSpan('http.request', { path: req.path });
    metrics.increment('http_requests_total', { path: req.path, method: req.method });
    res.on('finish', () => span.end());
    next();
  });

  app.get('/health/live', (req, res) => healthController.live(req, res));
  app.get('/health/ready', (req, res) => healthController.ready(req, res));
  app.get('/openapi.json', (_req, res) => res.json(openApiSpec));
  app.use('/v1', buildV1Router(authService, webhookController, messageController, sessionController));
  app.use(errorHandler);

  return app;
}
