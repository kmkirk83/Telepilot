import { Router } from 'express';
import type { MessageController } from '../controllers/message-controller.js';
import type { SessionController } from '../controllers/session-controller.js';
import type { WebhookController } from '../controllers/webhook-controller.js';
import type { AuthService } from '../services/auth-service.js';
import { apiKeyAuth, type TenantRequest } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';

export function buildV1Router(
  authService: AuthService,
  webhookController: WebhookController,
  messageController: MessageController,
  sessionController: SessionController
) {
  const router = Router();
  const authenticatedLimiter = createRateLimiter(60_000, 120);

  router.post('/webhook/telegram/:tenantId', (req, res, next) => {
    try {
      webhookController.ingest(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages', authenticatedLimiter, apiKeyAuth(authService), (req, res, next) => {
    try {
      req.app.locals.authTenant = (req as TenantRequest).tenant;
      messageController.submit(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.get('/sessions/:id', authenticatedLimiter, apiKeyAuth(authService), (req, res, next) => {
    try {
      sessionController.getById(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
