import { z } from 'zod';
import { ChartEncodingSchema, ChartKindSchema, ChartStyleOptionsSchema } from './chart-type.js';

export const CardQueryDefinitionSchema = z.object({
  connectionId: z.string().uuid(),
  rawSql: z.string().optional(),
  queryIr: z.record(z.string(), z.unknown()).optional(),
  cacheTtlSeconds: z.number().int().min(0).default(30),
});

export type CardQueryDefinition = z.infer<typeof CardQueryDefinitionSchema>;

export const DashboardCardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  chartKind: ChartKindSchema,
  encoding: ChartEncodingSchema,
  style: ChartStyleOptionsSchema.default({}),
  query: CardQueryDefinitionSchema,
  layout: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1),
    h: z.number().int().min(1),
    minW: z.number().int().min(1).default(2),
    minH: z.number().int().min(1).default(2),
  }),
});

export type DashboardCard = z.infer<typeof DashboardCardSchema>;

export const DashboardDocumentSchema = z.object({
  version: z.literal(1),
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  cards: z.array(DashboardCardSchema).default([]),
  refreshIntervalSeconds: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DashboardDocument = z.infer<typeof DashboardDocumentSchema>;
