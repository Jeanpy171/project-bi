import { describe, expect, it } from 'vitest';
import { validateReadOnlySql } from '../ast-validator.js';
import { compileQueryIrToPostgres, type QueryIr } from '../query-ir.js';

describe('validateReadOnlySql', () => {
  it('should accept valid SELECT queries and apply default limit', () => {
    const result = validateReadOnlySql('SELECT id, name FROM users');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sanitizedSql).toBe('SELECT id, name FROM users LIMIT 5000');
      expect(result.value.effectiveLimit).toBe(5000);
    }
  });

  it('should clamp limit if user specifies a limit exceeding maxLimit', () => {
    const result = validateReadOnlySql('SELECT id FROM users LIMIT 50000', 1000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sanitizedSql).toBe('SELECT id FROM users LIMIT 1000');
      expect(result.value.effectiveLimit).toBe(1000);
    }
  });

  it('should reject DROP, DELETE, UPDATE or ALTER statements', () => {
    const dropTest = validateReadOnlySql('DROP TABLE users');
    expect(dropTest.ok).toBe(false);

    const deleteTest = validateReadOnlySql('DELETE FROM users WHERE id = 1');
    expect(deleteTest.ok).toBe(false);

    const updateTest = validateReadOnlySql('UPDATE users SET name = "hacked"');
    expect(updateTest.ok).toBe(false);

    const selectWithDrop = validateReadOnlySql('SELECT * FROM users; DROP TABLE orders;');
    expect(selectWithDrop.ok).toBe(false);
  });
});

describe('compileQueryIrToPostgres', () => {
  it('should compile basic IR to valid SQL with GROUP BY and aggregations', () => {
    const ir: QueryIr = {
      sourceTable: 'orders',
      sourceSchema: 'public',
      fields: ['shipping_country'],
      aggregations: [
        { field: 'total_amount', fn: 'sum', alias: 'total_sales' },
        { field: 'id', fn: 'count', alias: 'total_orders' },
      ],
      groupBy: ['shipping_country'],
      filters: [{ field: 'status', operator: 'eq', value: 'completed' }],
      joins: [],
      sorts: [{ field: 'total_sales', direction: 'desc' }],
      limit: 10,
      offset: 0,
    };

    const sql = compileQueryIrToPostgres(ir);
    expect(sql).toContain('SELECT "shipping_country", SUM("total_amount") AS "total_sales", COUNT("id") AS "total_orders"');
    expect(sql).toContain('FROM "public"."orders"');
    expect(sql).toContain('WHERE "status" = \'completed\'');
    expect(sql).toContain('GROUP BY "shipping_country"');
    expect(sql).toContain('ORDER BY "total_sales" DESC');
    expect(sql).toContain('LIMIT 10');
  });
});
