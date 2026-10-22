import { z } from 'zod';

export const FilterOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
  'is_null',
  'is_not_null',
  'between',
]);

export type FilterOperator = z.infer<typeof FilterOperatorSchema>;

export const QueryFilterSchema = z.object({
  field: z.string(),
  operator: FilterOperatorSchema,
  value: z.unknown(),
});

export type QueryFilter = z.infer<typeof QueryFilterSchema>;

export const AggregationFunctionSchema = z.enum([
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'count_distinct',
]);

export type AggregationFunction = z.infer<typeof AggregationFunctionSchema>;

export const QueryAggregationSchema = z.object({
  field: z.string(),
  fn: AggregationFunctionSchema,
  alias: z.string().optional(),
});

export type QueryAggregation = z.infer<typeof QueryAggregationSchema>;

export const QuerySortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export type QuerySort = z.infer<typeof QuerySortSchema>;

export const QueryJoinSchema = z.object({
  targetTable: z.string(),
  type: z.enum(['inner', 'left', 'right']).default('left'),
  on: z.object({
    sourceField: z.string(),
    targetField: z.string(),
  }),
});

export type QueryJoin = z.infer<typeof QueryJoinSchema>;

export const QueryIrSchema = z.object({
  sourceTable: z.string(),
  sourceSchema: z.string().default('public'),
  fields: z.array(z.string()).default([]),
  aggregations: z.array(QueryAggregationSchema).default([]),
  groupBy: z.array(z.string()).default([]),
  filters: z.array(QueryFilterSchema).default([]),
  joins: z.array(QueryJoinSchema).default([]),
  sorts: z.array(QuerySortSchema).default([]),
  limit: z.number().int().positive().default(1000),
  offset: z.number().int().nonnegative().default(0),
});

export type QueryIr = z.infer<typeof QueryIrSchema>;

/**
 * Compiles a Query Intermediate Representation (IR) into standard PostgreSQL syntax.
 */
export const compileQueryIrToPostgres = (ir: QueryIr): string => {
  const selectParts: string[] = [];

  // Plain fields
  for (const field of ir.fields) {
    selectParts.push(`"${field}"`);
  }

  // Aggregations
  for (const agg of ir.aggregations) {
    const alias = agg.alias ? ` AS "${agg.alias}"` : ` AS "${agg.fn}_${agg.field}"`;
    if (agg.fn === 'count_distinct') {
      selectParts.push(`COUNT(DISTINCT "${agg.field}")${alias}`);
    } else {
      selectParts.push(`${agg.fn.toUpperCase()}("${agg.field}")${alias}`);
    }
  }

  if (selectParts.length === 0) {
    selectParts.push('*');
  }

  let sql = `SELECT ${selectParts.join(', ')} FROM "${ir.sourceSchema}"."${ir.sourceTable}"`;

  // Joins
  for (const join of ir.joins) {
    sql += ` ${join.type.toUpperCase()} JOIN "${join.targetTable}" ON "${ir.sourceTable}"."${join.on.sourceField}" = "${join.targetTable}"."${join.on.targetField}"`;
  }

  // WHERE Filters
  if (ir.filters.length > 0) {
    const whereClauses = ir.filters.map((f) => {
      switch (f.operator) {
        case 'eq':
          return `"${f.field}" = '${String(f.value).replace(/'/g, "''")}'`;
        case 'neq':
          return `"${f.field}" != '${String(f.value).replace(/'/g, "''")}'`;
        case 'gt':
          return `"${f.field}" > ${Number(f.value)}`;
        case 'gte':
          return `"${f.field}" >= ${Number(f.value)}`;
        case 'lt':
          return `"${f.field}" < ${Number(f.value)}`;
        case 'lte':
          return `"${f.field}" <= ${Number(f.value)}`;
        case 'contains':
          return `"${f.field}" ILIKE '%${String(f.value).replace(/'/g, "''")}%'`;
        case 'is_null':
          return `"${f.field}" IS NULL`;
        case 'is_not_null':
          return `"${f.field}" IS NOT NULL`;
        default:
          return '1=1';
      }
    });
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // GROUP BY
  if (ir.groupBy.length > 0) {
    const groupParts = ir.groupBy.map((g) => `"${g}"`);
    sql += ` GROUP BY ${groupParts.join(', ')}`;
  }

  // ORDER BY
  if (ir.sorts.length > 0) {
    const sortParts = ir.sorts.map((s) => `"${s.field}" ${s.direction.toUpperCase()}`);
    sql += ` ORDER BY ${sortParts.join(', ')}`;
  }

  sql += ` LIMIT ${ir.limit}`;

  if (ir.offset > 0) {
    sql += ` OFFSET ${ir.offset}`;
  }

  return sql;
};
