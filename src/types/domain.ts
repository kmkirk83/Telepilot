export interface TenantConfig {
  id: string;
  name: string;
  apiKey: string;
  provider: ProviderKind;
  providerConfig: Record<string, string>;
  telegram?: {
    botToken?: string | undefined;
    webhookSecret?: string | undefined;
  };
  oauth?: OAuthInstallState;
}

export interface OAuthInstallState {
  installUrl: string;
  redirectUri: string;
  clientIdEnvVar: string;
  clientSecretEnvVar: string;
  scopes: string[];
}

export type ProviderKind = 'copilot' | 'openai' | 'mcp';

export interface CanonicalMessage {
  id: string;
  tenantId: string;
  sessionId: string;
  text: string;
  source: 'telegram' | 'api';
  correlationId: string;
  senderId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface DispatchResult {
  provider: ProviderKind;
  sessionId: string;
  messageId: string;
  outputText: string;
}

export interface SessionRecord {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    text: string;
    source: CanonicalMessage['source'];
    outputText?: string | undefined;
  }>;
}

export interface QueueJob<T> {
  id: string;
  attempts: number;
  payload: T;
  correlationId: string;
}

export interface TelegramWebhookPayload {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number | string };
    from?: { id?: number | string };
  };
}
