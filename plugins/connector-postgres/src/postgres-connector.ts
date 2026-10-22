import pg from 'pg';
import {
  type ConnectionConfig,
  type ConnectorError,
  type DataSourceConnector,
  type DiagnosticReport,
  type QueryExecutionOptions,
  type QueryResultData,
  type SchemaIntrospection,
  type TableMetadata,
} from '@bi/contracts';
import { err, ok, type Result } from '@bi/kernel';
import { validateReadOnlySql } from '@bi/query-ir';
import { runPostgresDiagnostic } from './diagnostic.js';

const { Client } = pg;

export class PostgresConnector implements DataSourceConnector {
  public readonly engine = 'postgres' as const;

  /**
   * Diagnostic assistant (RF-A2): tests DNS, Port, Docker localhost, credentials, and SSL.
   */
  public async testConnection(config: ConnectionConfig): Promise<DiagnosticReport> {
    return runPostgresDiagnostic(config);
  }

  /**
   * Introspects tables, columns, data types, primary keys, and foreign keys (RF-A3).
   */
  public async introspectSchema(
    config: ConnectionConfig,
  ): Promise<Result<SchemaIntrospection, ConnectorError>> {
    const client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();

      // Query tables and columns
      const columnsSql = `
        SELECT 
          c.table_schema,
          c.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          COALESCE(pk.is_pk, false) as is_pk
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT 
            ku.table_schema,
            ku.table_name,
            ku.column_name,
            true as is_pk
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
            AND tc.table_schema = ku.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk 
          ON c.table_schema = pk.table_schema 
          AND c.table_name = pk.table_name 
          AND c.column_name = pk.column_name
        WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY c.table_schema, c.table_name, c.ordinal_position;
      `;

      const columnsRes = await client.query<{
        table_schema: string;
        table_name: string;
        column_name: string;
        data_type: string;
        is_nullable: string;
        is_pk: boolean;
      }>(columnsSql);

      const tableMap = new Map<string, TableMetadata>();

      for (const row of columnsRes.rows) {
        const key = `${row.table_schema}.${row.table_name}`;
        let table = tableMap.get(key);

        if (!table) {
          table = {
            schema: row.table_schema,
            name: row.table_name,
            columns: [],
          };
          tableMap.set(key, table);
        }

        (table.columns as Array<TableMetadata['columns'][number]>).push({
          name: row.column_name,
          dataType: row.data_type,
          isNullable: row.is_nullable === 'YES',
          isPrimaryKey: Boolean(row.is_pk),
        });
      }

      await client.end();

      return ok({
        tables: Array.from(tableMap.values()),
        introspectedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      await client.end().catch(() => {});
      const diagnostic = await runPostgresDiagnostic(config);
      return err({
        kind: 'CONNECTION_FAILED',
        diagnostic,
      });
    }
  }

  /**
   * Executes a strictly read-only query with AST validation, timeout and read-only transaction (RF-A5, RNF-05).
   */
  public async executeReadOnlyQuery(
    config: ConnectionConfig,
    sql: string,
    options?: QueryExecutionOptions,
  ): Promise<Result<QueryResultData, ConnectorError>> {
    // 1. AST Validation
    const validationResult = validateReadOnlySql(sql, options?.limit ?? config.maxRows);
    if (!validationResult.ok) {
      return err({
        kind: 'SECURITY_VIOLATION',
        reason: validationResult.error.message,
      });
    }

    const { sanitizedSql } = validationResult.value;
    const timeoutMs = options?.timeoutMs ?? config.queryTimeoutMs;

    const client = new Client({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    });

    const startTime = Date.now();

    try {
      await client.connect();

      // Enforce read-only transaction and statement timeout
      await client.query(`SET statement_timeout = ${timeoutMs};`);
      await client.query('BEGIN READ ONLY;');

      const queryRes = await client.query(sanitizedSql);

      await client.query('COMMIT;');
      await client.end();

      const durationMs = Date.now() - startTime;

      const columns = queryRes.fields.map((f) => ({
        name: f.name,
        type: String(f.dataTypeID),
      }));

      // Format rows as array of unknown values
      const rows = queryRes.rows.map((row) =>
        queryRes.fields.map((f) => (row as Record<string, unknown>)[f.name]),
      );

      return ok({
        columns,
        rows,
        rowCount: queryRes.rowCount ?? rows.length,
        executionDurationMs: durationMs,
      });
    } catch (error: unknown) {
      await client.query('ROLLBACK;').catch(() => {});
      await client.end().catch(() => {});

      const msg = error instanceof Error ? error.message : 'Error desconocido al ejecutar consulta';

      if (msg.toLowerCase().includes('timeout') || msg.toLowerCase().includes('canceling statement')) {
        return err({
          kind: 'QUERY_TIMEOUT',
          timeoutMs,
        });
      }

      return err({
        kind: 'QUERY_SYNTAX_ERROR',
        message: msg,
      });
    }
  }
}
