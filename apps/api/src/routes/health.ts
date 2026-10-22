import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
  version: z.string(),
  uptimeSeconds: z.number(),
});

export const healthRoute = new OpenAPIHono();

const route = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Health check endpoint',
  description: 'Verifies that the API server is up and responsive.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'System is healthy',
    },
  },
});

healthRoute.openapi(route, (c) => {
  return c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    uptimeSeconds: process.uptime(),
  });
});
