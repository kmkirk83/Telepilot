export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Telepilot Connector API',
    version: '1.0.0'
  },
  components: {
    securitySchemes: {
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key'
      },
      telegramSecretToken: {
        type: 'apiKey',
        in: 'header',
        name: 'x-telegram-bot-api-secret-token'
      }
    }
  },
  paths: {
    '/health/live': {
      get: { responses: { '200': { description: 'Liveness check' } } }
    },
    '/health/ready': {
      get: { responses: { '200': { description: 'Readiness check' } } }
    },
    '/v1/webhook/telegram/{tenantId}': {
      post: {
        parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ telegramSecretToken: [] }],
        responses: { '202': { description: 'Webhook accepted' } }
      }
    },
    '/v1/messages': {
      post: { security: [{ apiKeyAuth: [] }], responses: { '202': { description: 'Message accepted' } } }
    },
    '/v1/sessions/{id}': {
      get: {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ apiKeyAuth: [] }],
        responses: { '200': { description: 'Session found' } }
      }
    }
  }
} as const;
