import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { AIAskRequestSchema, AIAskResponseSchema } from '@bi/contracts';
import { executeAIAsk, listOllamaModels } from '../services/ai-service.js';

export const aiRoute = new OpenAPIHono();

// 1. List Ollama Models Route
const listModelsRoute = createRoute({
  method: 'get',
  path: '/api/ai/ollama/models',
  tags: ['AI'],
  summary: 'List available Ollama models',
  description: 'Probes local Ollama instance at baseUrl and retrieves installed models.',
  request: {
    query: z.object({
      baseUrl: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            models: z.array(z.string()),
            isAvailable: z.boolean(),
          }),
        },
      },
      description: 'List of installed Ollama models',
    },
    503: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            isAvailable: z.literal(false),
          }),
        },
      },
      description: 'Ollama is unreachable',
    },
  },
});

aiRoute.openapi(listModelsRoute, async (c) => {
  const { baseUrl } = c.req.valid('query');
  const result = await listOllamaModels(baseUrl);

  if (!result.ok) {
    return c.json(
      {
        error: result.error,
        isAvailable: false,
      },
      503,
    );
  }

  return c.json(
    {
      models: result.value,
      isAvailable: true,
    },
    200,
  );
});

// 2. Ask AI / Copilot Route
const askRoute = createRoute({
  method: 'post',
  path: '/api/ai/ask',
  tags: ['AI'],
  summary: 'Ask the BI & Accounting AI Copilot',
  description: 'Sends query to Ollama or Gemini, generates SQL and card drafts.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AIAskRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AIAskResponseSchema,
        },
      },
      description: 'AI response with optional SQL and Card Draft',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Error executing AI query',
    },
  },
});

aiRoute.openapi(askRoute, async (c) => {
  const body = c.req.valid('json');
  const result = await executeAIAsk(body);

  if (!result.ok) {
    return c.json({ error: result.error }, 400);
  }

  return c.json(result.value, 200);
});
