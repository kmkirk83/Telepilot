import type { Request, Response } from 'express';
import { NormalizationService } from '../services/normalization-service.js';
import type { WebhookService } from '../services/webhook-service.js';
import type { TenantConfig } from '../types/domain.js';

export class MessageController {
  constructor(
    private readonly normalization: NormalizationService,
    private readonly webhookService: WebhookService
  ) {}

  submit(req: Request, res: Response) {
    const tenant = req.app.locals.authTenant as TenantConfig;
    const correlationId = req.header('x-correlation-id') ?? crypto.randomUUID();
    const message = this.normalization.fromApi(req.body, tenant, correlationId);
    const result = this.webhookService.accept(message, tenant);
    res.status(202).json({ data: result });
  }
}
