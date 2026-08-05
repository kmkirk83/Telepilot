import type { ProviderAdapter } from './provider-adapter.js';
import type { CanonicalMessage, DispatchResult, TenantConfig } from '../types/domain.js';

export class OpenAiAdapter implements ProviderAdapter {
  readonly kind = 'openai' as const;

  async dispatch(message: CanonicalMessage, tenant: TenantConfig): Promise<DispatchResult> {
    return {
      provider: this.kind,
      sessionId: message.sessionId,
      messageId: message.id,
      outputText: `[openai:${tenant.id}] ${message.text}`
    };
  }
}
