import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  API_KEYS: z.string().default('tenant-default:dev-api-key'),
  TENANT_PROVIDERS: z.string().default('tenant-default:copilot'),
  TELEGRAM_WEBHOOK_SECRET: z.string().default(''),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  QUEUE_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(3),
  QUEUE_BACKOFF_MS: z.coerce.number().int().min(1).default(50),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(60),
  OPENAI_API_KEY: z.string().default(''),
  COPILOT_API_KEY: z.string().default(''),
  MCP_BASE_URL: z.string().url().optional().or(z.literal('')),
  OAUTH_CLIENT_ID: z.string().default(''),
  OAUTH_CLIENT_SECRET: z.string().default(''),
  OAUTH_REDIRECT_URI: z.string().url().default('http://localhost:3000/oauth/callback')
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
