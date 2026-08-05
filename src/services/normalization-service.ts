import { ValidationError } from '../infra/errors.js';
import type { CanonicalMessage, TelegramWebhookPayload, TenantConfig } from '../types/domain.js';

export class NormalizationService {
  fromTelegram(payload: TelegramWebhookPayload, tenant: TenantConfig, correlationId: string): CanonicalMessage {
    const text = payload.message?.text?.trim();
    const sessionId = payload.message?.chat?.id;
    const updateId = payload.update_id;
    const messageId = payload.message?.message_id;

    if (!text || !sessionId || updateId == null || messageId == null) {
      throw new ValidationError('Telegram payload missing required fields');
    }

    return {
      id: `telegram-${tenant.id}-${String(sessionId)}-${String(messageId)}`,
      tenantId: tenant.id,
      sessionId: String(sessionId),
      text,
      source: 'telegram',
      correlationId,
      senderId: payload.message?.from?.id ? String(payload.message.from.id) : undefined,
      metadata: {
        updateId
      }
    };
  }

  fromApi(payload: { sessionId?: string; text?: string; idempotencyKey?: string }, tenant: TenantConfig, correlationId: string): CanonicalMessage {
    if (!payload.sessionId || !payload.text?.trim() || !payload.idempotencyKey) {
      throw new ValidationError('Message payload missing required fields');
    }

    return {
      id: payload.idempotencyKey,
      tenantId: tenant.id,
      sessionId: payload.sessionId,
      text: payload.text.trim(),
      source: 'api',
      correlationId
    };
  }
}
