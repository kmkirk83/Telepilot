import type { ProviderAdapter } from './provider-adapter.js';
import type { CanonicalMessage, DispatchResult, TenantConfig } from '../types/domain.js';

export class CopilotAdapter implements ProviderAdapter {
  readonly kind = 'copilot' as const;

  async dispatch(message: CanonicalMessage, tenant: TenantConfig): Promise<DispatchResult> {
    return {
      provider: this.kind,
      sessionId: message.sessionId,
      messageId: message.id,
      outputText: `[copilot:${tenant.id}] ${message.text}`
    };
  }
}
