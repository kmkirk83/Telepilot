import { NotFoundError } from '../infra/errors.js';
import type { ProviderAdapter } from '../providers/provider-adapter.js';
import type { ProviderKind } from '../types/domain.js';

export class ProviderRegistry {
  private readonly providers = new Map<ProviderKind, ProviderAdapter>();

  constructor(adapters: ProviderAdapter[]) {
    for (const adapter of adapters) {
      this.providers.set(adapter.kind, adapter);
    }
  }

  get(kind: ProviderKind): ProviderAdapter {
    const provider = this.providers.get(kind);
    if (!provider) {
      throw new NotFoundError(`Provider not registered: ${kind}`);
    }
    return provider;
  }
}
