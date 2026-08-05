import type { CanonicalMessage, DispatchResult, ProviderKind, TenantConfig } from '../types/domain.js';

export interface ProviderAdapter {
  readonly kind: ProviderKind;
  dispatch(message: CanonicalMessage, tenant: TenantConfig): Promise<DispatchResult>;
}
