import { AuthenticationError } from '../infra/errors.js';
import type { TenantConfig } from '../types/domain.js';

export class AuthService {
  constructor(private readonly tenants: Map<string, TenantConfig>) {}

  authenticate(apiKey?: string): TenantConfig {
    if (!apiKey) {
      throw new AuthenticationError('Missing API key');
    }

    for (const tenant of this.tenants.values()) {
      if (tenant.apiKey === apiKey) {
        return tenant;
      }
    }

    throw new AuthenticationError('Invalid API key');
  }
}
