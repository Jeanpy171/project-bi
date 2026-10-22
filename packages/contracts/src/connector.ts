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

export type DiagnosticStepCode =
  | 'DNS_RESOLUTION'
  | 'TCP_PORT_REACHABILITY'
  | 'DOCKER_LOCALHOST_CHECK'
  | 'AUTHENTICATION'
  | 'SSL_HANDSHAKE'
  | 'READONLY_PERMISSION_CHECK';

export interface DiagnosticStep {
  readonly code: DiagnosticStepCode;
  readonly label: string;
  readonly status: 'passed' | 'failed' | 'warning' | 'skipped';
  readonly message?: string;
  readonly suggestedFix?: string;
}

export interface DiagnosticReport {
  readonly isHealthy: boolean;
  readonly latencyMs: number;
  readonly steps: readonly DiagnosticStep[];
}

export interface ColumnMetadata {
  readonly name: string;
  readonly dataType: string;
  readonly isNullable: boolean;
  readonly isPrimaryKey: boolean;
  readonly foreignKeyTo?: {
    readonly table: string;
    readonly column: string;
  };
}

export interface TableMetadata {
  readonly schema: string;
  readonly name: string;
  readonly description?: string;
  readonly rowCountEstimate?: number;
  readonly columns: readonly ColumnMetadata[];
}

export interface SchemaIntrospection {
  readonly tables: readonly TableMetadata[];
  readonly introspectedAt: string;
}

export interface QueryExecutionOptions {
  readonly timeoutMs?: number;
  readonly limit?: number;
}

export interface QueryResultData {
  readonly columns: readonly { readonly name: string; readonly type: string }[];
  readonly rows: readonly (readonly unknown[])[];
  readonly rowCount: number;
  readonly executionDurationMs: number;
}

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
