import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { ConnectionConfigSchema, QueryResultDataSchema } from '@bi/contracts';
import { compileQueryIrToPostgres, QueryIrSchema } from '@bi/query-ir';
import { PostgresConnector } from '@bi/connector-postgres';

export const queriesRoute = new OpenAPIHono();
const postgresConnector = new PostgresConnector();

// 1. Run Read-Only Query Route
const runQueryRoute = createRoute({
  method: 'post',
  path: '/api/queries/run',
  tags: ['Queries'],
  summary: 'Execute a read-only SQL query',
  description: 'Validates SQL via AST, applies LIMIT, timeout and executes in a read-only transaction.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            connection: ConnectionConfigSchema,
            sql: z.string().min(1),
            limit: z.number().int().positive().optional(),
            timeoutMs: z.number().int().positive().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: QueryResultDataSchema,
          }),
        },
      },
      description: 'Query executed successfully',
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
      description: 'Query execution or safety violation error',
    },
  },
});

queriesRoute.openapi(runQueryRoute, async (c) => {
  const body = c.req.valid('json');
  const result = await postgresConnector.executeReadOnlyQuery(
    body.connection,
    body.sql,
    {
      limit: body.limit,
      timeoutMs: body.timeoutMs,
    },
  );

  if (!result.ok) {
    const errorDetails = result.error;
    let message = 'Error al ejecutar la consulta.';
    if (errorDetails.kind === 'SECURITY_VIOLATION') {
      message = errorDetails.reason;
    } else if (errorDetails.kind === 'QUERY_SYNTAX_ERROR') {
      message = errorDetails.message;
    } else if (errorDetails.kind === 'QUERY_TIMEOUT') {
      message = `La consulta excedió el tiempo límite de ${errorDetails.timeoutMs}ms.`;
    }

    return c.json(
      {
        error: {
          code: errorDetails.kind,
          message,
          details: errorDetails,
        },
      },
      400,
    );
  }

  return c.json({ data: result.value }, 200);
});

// 2. Compile Query IR Route
const compileQueryRoute = createRoute({
  method: 'post',
  path: '/api/queries/compile',
  tags: ['Queries'],
  summary: 'Compile Query IR into SQL',
  description: 'Compiles visual query builder state (Query IR) into engine-optimized SQL.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: QueryIrSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              sql: z.string(),
            }),
          }),
        },
      },
      description: 'Query IR compiled successfully',
    },
  },
});

queriesRoute.openapi(compileQueryRoute, (c) => {
  const ir = c.req.valid('json');
  const sql = compileQueryIrToPostgres(ir);
  return c.json({ data: { sql } }, 200);
});
