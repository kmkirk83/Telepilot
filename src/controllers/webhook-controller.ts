import type { Request, Response } from 'express';
import { AuthenticationError } from '../infra/errors.js';
import { NormalizationService } from '../services/normalization-service.js';
import type { WebhookService } from '../services/webhook-service.js';
import type { TenantConfig } from '../types/domain.js';

export class WebhookController {
  constructor(
    private readonly normalization: NormalizationService,
    private readonly webhookService: WebhookService,
    private readonly tenants: Map<string, TenantConfig>,
    private readonly webhookSecret: string
  ) {}

  ingest(req: Request, res: Response) {
    const tenantId = Array.isArray(req.params.tenantId) ? req.params.tenantId[0] : req.params.tenantId;
    const tenant = tenantId ? this.tenants.get(tenantId) : undefined;
    if (!tenant) {
      throw new AuthenticationError('Unknown tenant');
    }

    const secret = req.header('x-telegram-bot-api-secret-token') ?? '';
    const expectedSecret = tenant.telegram?.webhookSecret ?? this.webhookSecret;
    if (!expectedSecret || secret !== expectedSecret) {
      throw new AuthenticationError('Invalid Telegram webhook secret');
    }

    const correlationId = req.header('x-correlation-id') ?? crypto.randomUUID();
    const message = this.normalization.fromTelegram(req.body, tenant, correlationId);
    const result = this.webhookService.accept(message, tenant);
    res.status(202).json({ data: result });
  }
}
