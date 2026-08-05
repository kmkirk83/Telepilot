import { ValidationError } from '../infra/errors.js';
import { IdempotencyStore } from '../infra/idempotency.js';
import { InMemoryQueue } from '../infra/queue.js';
import type { CanonicalMessage, QueueJob } from '../types/domain.js';
import type { RouterService } from './router-service.js';
import type { TenantConfig } from '../types/domain.js';

export class WebhookService {
  constructor(
    private readonly queue: InMemoryQueue<{ message: CanonicalMessage; tenant: TenantConfig }>,
    private readonly idempotency: IdempotencyStore,
    private readonly router: RouterService
  ) {
    this.queue.registerHandler(async (job) => this.process(job));
  }

  accept(message: CanonicalMessage, tenant: TenantConfig) {
    if (this.idempotency.has(message.id)) {
      return { accepted: true, duplicate: true };
    }

    this.idempotency.add(message.id);
    this.queue.enqueue({
      id: message.id,
      attempts: 0,
      payload: { message, tenant },
      correlationId: message.correlationId
    });
    return { accepted: true, duplicate: false };
  }

  private async process(job: QueueJob<{ message: CanonicalMessage; tenant: TenantConfig }>) {
    const { message, tenant } = job.payload;
    if (!message.text) {
      throw new ValidationError('Message text is required');
    }
    await this.router.route(message, tenant);
  }
}
