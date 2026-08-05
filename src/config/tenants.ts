import type { AppEnv } from './env.js';
import type { ProviderKind, TenantConfig } from '../types/domain.js';

const providerKinds: ProviderKind[] = ['copilot', 'openai', 'mcp'];

function parseMap(value: string): Record<string, string> {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, entry) => {
      const parts = entry.split(':');
      if (parts.length !== 2) {
        throw new Error(`Invalid mapping entry: ${entry}`);
      }
      const [key, rawValue] = parts;
      if (!key || !rawValue) {
        throw new Error(`Invalid mapping entry: ${entry}`);
      }
      acc[key] = rawValue;
      return acc;
    }, {});
}

export function buildTenants(env: AppEnv): Map<string, TenantConfig> {
  const apiKeys = parseMap(env.API_KEYS);
  const providers = parseMap(env.TENANT_PROVIDERS);
  const tenants = new Map<string, TenantConfig>();

  for (const [tenantId, apiKey] of Object.entries(apiKeys)) {
    const providerValue = providers[tenantId] ?? 'copilot';
    if (!providerKinds.includes(providerValue as ProviderKind)) {
      throw new Error(`Unsupported provider for tenant ${tenantId}: ${providerValue}`);
    }
    const provider = providerValue as ProviderKind;
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
