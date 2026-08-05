import type { CanonicalMessage, DispatchResult, TenantConfig } from '../types/domain.js';
import { ProviderRegistry } from './provider-registry.js';
import { SessionStore } from './session-store.js';

export class RouterService {
  constructor(
    private readonly providers: ProviderRegistry,
    private readonly sessions: SessionStore
  ) {}

  async route(message: CanonicalMessage, tenant: TenantConfig): Promise<DispatchResult> {
    const provider = this.providers.get(tenant.provider);
    const result = await provider.dispatch(message, tenant);
    this.sessions.append(message, result);
    return result;
  }
}
