import { z } from 'zod';

export const ChartKindSchema = z.enum([
  'kpi',
  'line',
  'area',
  'bar_grouped',
  'bar_stacked',
  'donut',
  'heatmap',
  'table_hierarchical',
  'funnel',
  'gauge',
]);

export type ChartKind = z.infer<typeof ChartKindSchema>;

export const ChartEncodingSchema = z.object({
  xField: z.string().optional(),
  yFields: z.array(z.string()).default([]),
  groupField: z.string().optional(),
  valueField: z.string().optional(),
  hierarchyField: z.string().optional(),
});

export type ChartEncoding = z.infer<typeof ChartEncodingSchema>;

export const ChartStyleOptionsSchema = z.object({
  title: z.string().optional(),
  palette: z.array(z.string()).optional(),
  showLegend: z.boolean().default(true),
  isSmooth: z.boolean().default(true),
  goalValue: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

export type ChartStyleOptions = z.infer<typeof ChartStyleOptionsSchema>;

export interface ChartTypeDefinition {
  readonly kind: ChartKind;
  readonly label: string;
  readonly description: string;
  readonly minDimensions: number;
  readonly maxDimensions: number;
  readonly minMeasures: number;
  readonly maxMeasures: number;
  readonly iconName: string;
}
