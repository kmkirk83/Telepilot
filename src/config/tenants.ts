import type { AppEnv } from './env.js';
import type { ProviderKind, TenantConfig } from '../types/domain.js';

function parseMap(value: string): Record<string, string> {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const [key, rawValue] = entry.split(':');
      if (key && rawValue) {
        acc[key] = rawValue;
      }
      return acc;
    }, {});
}

export function buildTenants(env: AppEnv): Map<string, TenantConfig> {
  const apiKeys = parseMap(env.API_KEYS);
  const providers = parseMap(env.TENANT_PROVIDERS);
  const tenants = new Map<string, TenantConfig>();

  for (const [tenantId, apiKey] of Object.entries(apiKeys)) {
    const provider = (providers[tenantId] ?? 'copilot') as ProviderKind;
    tenants.set(tenantId, {
      id: tenantId,
      name: tenantId,
      apiKey,
      provider,
      providerConfig: {},
      telegram: {
        botToken: env.TELEGRAM_BOT_TOKEN || undefined,
        webhookSecret: env.TELEGRAM_WEBHOOK_SECRET || undefined
      },
      oauth: {
        installUrl: '/oauth/install',
        redirectUri: env.OAUTH_REDIRECT_URI,
        clientIdEnvVar: 'OAUTH_CLIENT_ID',
        clientSecretEnvVar: 'OAUTH_CLIENT_SECRET',
        scopes: ['telegram:connect', 'provider:connect']
      }
    });
  }

  return tenants;
}
