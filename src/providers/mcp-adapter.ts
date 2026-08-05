import type { ProviderAdapter } from './provider-adapter.js';
import type { CanonicalMessage, DispatchResult, TenantConfig } from '../types/domain.js';

export class McpAdapter implements ProviderAdapter {
  readonly kind = 'mcp' as const;

  async dispatch(message: CanonicalMessage, tenant: TenantConfig): Promise<DispatchResult> {
    return {
      provider: this.kind,
      sessionId: message.sessionId,
      messageId: message.id,
      outputText: `[mcp:${tenant.id}] ${message.text}`
    };
  }
}
