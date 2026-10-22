import { z } from 'zod';
import type { Result } from '@bi/kernel';

export const ConnectionConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  engine: z.enum(['postgres', 'mysql', 'duckdb', 'sqlite']),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  database: z.string().min(1),
  user: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean().default(false),
  readOnly: z.literal(true).default(true),
  queryTimeoutMs: z.number().int().positive().default(15000),
  maxRows: z.number().int().positive().default(5000),
});

export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>;

export const DiagnosticStepCodeSchema = z.enum([
  'DNS_RESOLUTION',
  'TCP_PORT_REACHABILITY',
  'DOCKER_LOCALHOST_CHECK',
  'AUTHENTICATION',
  'SSL_HANDSHAKE',
  'READONLY_PERMISSION_CHECK',
]);

export type DiagnosticStepCode = z.infer<typeof DiagnosticStepCodeSchema>;

export const DiagnosticStepSchema = z.object({
  code: DiagnosticStepCodeSchema,
  label: z.string(),
  status: z.enum(['passed', 'failed', 'warning', 'skipped']),
  message: z.string().optional(),
  suggestedFix: z.string().optional(),
});

export type DiagnosticStep = z.infer<typeof DiagnosticStepSchema>;

export const DiagnosticReportSchema = z.object({
  isHealthy: z.boolean(),
  latencyMs: z.number(),
  steps: z.array(DiagnosticStepSchema),
});

export type DiagnosticReport = z.infer<typeof DiagnosticReportSchema>;

export const ColumnMetadataSchema = z.object({
  name: z.string(),
  dataType: z.string(),
  isNullable: z.boolean(),
  isPrimaryKey: z.boolean(),
  foreignKeyTo: z
    .object({
      table: z.string(),
      column: z.string(),
    })
    .optional(),
});

export type ColumnMetadata = z.infer<typeof ColumnMetadataSchema>;

export const TableMetadataSchema = z.object({
  schema: z.string(),
  name: z.string(),
  description: z.string().optional(),
  rowCountEstimate: z.number().optional(),
  columns: z.array(ColumnMetadataSchema),
});

export type TableMetadata = z.infer<typeof TableMetadataSchema>;

export const SchemaIntrospectionSchema = z.object({
  tables: z.array(TableMetadataSchema),
  introspectedAt: z.string(),
});

export type SchemaIntrospection = z.infer<typeof SchemaIntrospectionSchema>;

export interface QueryExecutionOptions {
  readonly timeoutMs?: number;
  readonly limit?: number;
}

export const QueryResultDataSchema = z.object({
  columns: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
    }),
  ),
  rows: z.array(z.array(z.unknown())),
  rowCount: z.number(),
  executionDurationMs: z.number(),
});

export type QueryResultData = z.infer<typeof QueryResultDataSchema>;

export type ConnectorError =
  | { readonly kind: 'CONNECTION_FAILED'; readonly diagnostic: DiagnosticReport }
  | { readonly kind: 'QUERY_TIMEOUT'; readonly timeoutMs: number }
  | { readonly kind: 'QUERY_SYNTAX_ERROR'; readonly message: string; readonly line?: number }
  | { readonly kind: 'SECURITY_VIOLATION'; readonly reason: string };

/**
 * Port: Contract that all data source plugins must implement.
 */
export interface DataSourceConnector {
  readonly engine: ConnectionConfig['engine'];

  testConnection(config: ConnectionConfig): Promise<DiagnosticReport>;

  introspectSchema(config: ConnectionConfig): Promise<Result<SchemaIntrospection, ConnectorError>>;

  executeReadOnlyQuery(
    config: ConnectionConfig,
    sql: string,
    options?: QueryExecutionOptions,
  ): Promise<Result<QueryResultData, ConnectorError>>;
}
