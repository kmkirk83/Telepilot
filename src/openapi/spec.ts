export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Telepilot Connector API',
    version: '1.0.0'
  },
  paths: {
    '/health/live': {
      get: { responses: { '200': { description: 'Liveness check' } } }
    },
    '/health/ready': {
      get: { responses: { '200': { description: 'Readiness check' } } }
    },
    '/v1/webhook/telegram': {
      post: { responses: { '202': { description: 'Webhook accepted' } } }
    },
    '/v1/messages': {
      post: { responses: { '202': { description: 'Message accepted' } } }
    },
    '/v1/sessions/{id}': {
      get: {
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Session found' } }
      }
    }
  }
} as const;
