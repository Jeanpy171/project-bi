import { z } from 'zod';
import { ChartKindSchema } from './chart-type.js';
import { ConnectionConfigSchema } from './connector.js';

export const LLMProviderIdSchema = z.enum(['ollama', 'gemini']);
export type LLMProviderId = z.infer<typeof LLMProviderIdSchema>;

export const LLMConfigSchema = z.object({
  provider: LLMProviderIdSchema.default('ollama'),
  model: z.string().min(1).default('qwen2.5-coder'),
  ollamaBaseUrl: z.string().default('http://localhost:11434'),
  geminiApiKey: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.1),
});
export type LLMConfig = z.infer<typeof LLMConfigSchema>;

export const LLMChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});
export type LLMChatMessage = z.infer<typeof LLMChatMessageSchema>;

export const TableColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  sampleValues: z.array(z.unknown()).optional(),
});
export type TableColumn = z.infer<typeof TableColumnSchema>;

export const SchemaContextSchema = z.record(
  z.string(),
  z.object({
    columns: z.array(TableColumnSchema),
    rowCount: z.number().optional(),
    description: z.string().optional(),
  }),
);
export type SchemaContext = z.infer<typeof SchemaContextSchema>;

export const CardDraftSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  chartKind: ChartKindSchema,
  sql: z.string().optional(),
  explanation: z.string(),
  confidence: z.number().min(0).max(1).default(1),
  suggestedEncoding: z
    .object({
      xField: z.string().optional(),
      yField: z.string().optional(),
      seriesField: z.string().optional(),
      aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max', 'none']).default('none'),
    })
    .optional(),
});
export type CardDraft = z.infer<typeof CardDraftSchema>;

export const AIAskRequestSchema = z.object({
  config: LLMConfigSchema,
  messages: z.array(LLMChatMessageSchema),
  schemaContext: SchemaContextSchema.optional(),
  connection: ConnectionConfigSchema.optional(),
});
export type AIAskRequest = z.infer<typeof AIAskRequestSchema>;

export const AIAskResponseSchema = z.object({
  reply: z.string(),
  executedSql: z.string().optional(),
  sqlResultSummary: z.string().optional(),
  cardDraft: CardDraftSchema.optional(),
  providerUsed: LLMProviderIdSchema,
  modelUsed: z.string(),
  latencyMs: z.number(),
});
export type AIAskResponse = z.infer<typeof AIAskResponseSchema>;

export const OllamaModelListSchema = z.object({
  models: z.array(
    z.object({
      name: z.string(),
      model: z.string(),
      size: z.number().optional(),
      modified_at: z.string().optional(),
    }),
  ),
});
export type OllamaModelList = z.infer<typeof OllamaModelListSchema>;
