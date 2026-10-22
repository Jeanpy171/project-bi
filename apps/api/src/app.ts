import { OpenAPIHono } from '@hono/zod-openapi';
import { healthRoute } from './routes/health.js';
import { connectionsRoute } from './routes/connections.js';
import { queriesRoute } from './routes/queries.js';

export const app = new OpenAPIHono();

// Global Error Handler
app.onError((err, c) => {
  return c.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Ha ocurrido un error inesperado en el servidor.',
      },
    },
    500,
  );
});

// Register Routes
app.route('/', healthRoute);
app.route('/', connectionsRoute);
app.route('/', queriesRoute);

// OpenAPI Specification Route
app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Proyecto BI API',
    version: '0.1.0',
    description: 'Contract-first REST API for Proyecto BI: Connections, Diagnostic, and Query IR.',
  },
});
