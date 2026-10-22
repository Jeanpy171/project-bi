import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  ConnectionConfigSchema,
  DiagnosticReportSchema,
  SchemaIntrospectionSchema,
} from '@bi/contracts';
import { PostgresConnector } from '@bi/connector-postgres';

export const connectionsRoute = new OpenAPIHono();
const postgresConnector = new PostgresConnector();

// 1. Test Connection Route
const testConnectionRoute = createRoute({
  method: 'post',
  path: '/api/connections/test',
  tags: ['Connections'],
  summary: 'Diagnose and test database connection',
  description: 'Executes guided network, DNS, Docker localhost, port, authentication, and read-only permission checks.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ConnectionConfigSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: DiagnosticReportSchema,
          }),
        },
      },
      description: 'Diagnostic report generated successfully',
    },
  },
});

connectionsRoute.openapi(testConnectionRoute, async (c) => {
  const config = c.req.valid('json');
  const report = await postgresConnector.testConnection(config);
  return c.json({ data: report }, 200);
});

// 2. Introspect Schema Route
const introspectSchemaRoute = createRoute({
  method: 'post',
  path: '/api/connections/introspect',
  tags: ['Connections'],
  summary: 'Introspect database schema',
  description: 'Retrieves all tables, columns, data types, and keys for the specified connection.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ConnectionConfigSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: SchemaIntrospectionSchema,
          }),
        },
      },
      description: 'Schema introspected successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.unknown().optional(),
            }),
          }),
        },
      },
      description: 'Connection or introspection failure',
    },
  },
});

connectionsRoute.openapi(introspectSchemaRoute, async (c) => {
  const config = c.req.valid('json');
  const result = await postgresConnector.introspectSchema(config);

  if (!result.ok) {
    return c.json(
      {
        error: {
          code: result.error.kind,
          message: 'No se pudo conectar a la base de datos para introspeccionar el esquema.',
          details: 'diagnostic' in result.error ? result.error.diagnostic : undefined,
        },
      },
      400,
    );
  }

  return c.json({ data: result.value }, 200);
});
