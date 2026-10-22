import { describe, expect, it } from 'vitest';
import { app } from '../app.js';

describe('API Server Integration Tests', () => {
  it('GET /health should return 200 with system status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = await res.json() as { status: string; version: string };
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
  });

  it('GET /doc should return valid OpenAPI 3.1.0 specification', async () => {
    const res = await app.request('/doc');
    expect(res.status).toBe(200);

    const spec = await res.json() as { openapi: string; paths: Record<string, unknown> };
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/health']).toBeDefined();
    expect(spec.paths['/api/connections/test']).toBeDefined();
    expect(spec.paths['/api/queries/run']).toBeDefined();
    expect(spec.paths['/api/queries/compile']).toBeDefined();
  });

  it('POST /api/queries/compile should transform Query IR to Postgres SQL', async () => {
    const payload = {
      sourceTable: 'products',
      sourceSchema: 'public',
      fields: ['sku', 'name', 'price'],
      aggregations: [],
      groupBy: [],
      filters: [{ field: 'price', operator: 'gt', value: 100 }],
      joins: [],
      sorts: [{ field: 'price', direction: 'desc' }],
      limit: 5,
      offset: 0,
    };

    const res = await app.request('/api/queries/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { sql: string } };
    expect(body.data.sql).toContain('SELECT "sku", "name", "price" FROM "public"."products"');
    expect(body.data.sql).toContain('WHERE "price" > 100');
    expect(body.data.sql).toContain('ORDER BY "price" DESC');
    expect(body.data.sql).toContain('LIMIT 5');
  });

  it('POST /api/queries/run should block mutation queries with 400', async () => {
    const maliciousPayload = {
      connection: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Target DB',
        engine: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'target_db',
        user: 'user',
        password: 'password',
        ssl: false,
        readOnly: true,
        queryTimeoutMs: 5000,
        maxRows: 1000,
      },
      sql: 'DROP TABLE customers;',
    };

    const res = await app.request('/api/queries/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maliciousPayload),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string; message: string } };
    expect(body.error.code).toBe('SECURITY_VIOLATION');
    expect(body.error.message).toContain('Solo se permiten consultas de lectura');
  });
});
