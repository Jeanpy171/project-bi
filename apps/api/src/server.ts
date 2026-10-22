import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env.API_PORT || 3001);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Proyecto BI API server running at http://localhost:${info.port}`);
    // eslint-disable-next-line no-console
    console.log(`📖 OpenAPI specification available at http://localhost:${info.port}/doc`);
  },
);
