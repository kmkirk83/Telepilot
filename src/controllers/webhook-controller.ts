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
    const secret = req.header('x-telegram-bot-api-secret-token') ?? '';
    if (this.webhookSecret && secret !== this.webhookSecret) {
      throw new AuthenticationError('Invalid Telegram webhook secret');
    }

    const tenantId = String(req.body?.tenantId ?? 'tenant-default');
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new AuthenticationError('Unknown tenant');
    }

    const correlationId = req.header('x-correlation-id') ?? crypto.randomUUID();
    const message = this.normalization.fromTelegram(req.body, tenant, correlationId);
    const result = this.webhookService.accept(message, tenant);
    res.status(202).json({ data: result });
  }
}
