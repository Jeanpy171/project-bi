import * as XLSX from 'xlsx';
import type { ConnectionConfig } from '@bi/contracts';

export interface DataColumn {
  readonly name: string;
  readonly type: 'string' | 'number' | 'date';
  readonly rawType?: string;
}

export interface DataTable {
  readonly id: string;
  readonly name: string;
  readonly schema?: string;
  readonly tableName?: string;
  readonly rowCountEstimate?: number;
  readonly columns: readonly DataColumn[];
  readonly rows: readonly Record<string, unknown>[];
  readonly isLive?: boolean;
}

export interface DataSource {
  readonly id: string;
  readonly name: string;
  readonly type: 'postgres' | 'excel' | 'csv';
  readonly tables: readonly DataTable[];
  readonly connectionConfig?: ConnectionConfig;
  readonly isConnected?: boolean;
}

export const mapPostgresTypeToCategory = (rawType: string): 'string' | 'number' | 'date' => {
  const t = rawType.toLowerCase();
  if (
    t.includes('int') ||
    t.includes('numeric') ||
    t.includes('decimal') ||
    t.includes('double') ||
    t.includes('real') ||
    t.includes('float') ||
    t.includes('money')
  ) {
    return 'number';
  }
  if (t.includes('date') || t.includes('time') || t.includes('timestamp')) {
    return 'date';
  }
  return 'string';
};

/**
 * Calls the API to introspect a live PostgreSQL database and create a DataSource with real tables.
 */
export async function introspectPostgresDataSource(
  config: ConnectionConfig,
): Promise<{ source: DataSource; error?: string }> {
  try {
    const res = await fetch('/api/connections/introspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        source: {
          id: config.id,
          name: `${config.name} (${config.database})`,
          type: 'postgres',
          tables: [],
          connectionConfig: config,
          isConnected: false,
        },
        error: errJson?.error?.message || `Error HTTP ${res.status} al introspeccionar la base de datos.`,
      };
    }

    const payload = (await res.json()) as {
      data: {
        tables: Array<{
          schema: string;
          name: string;
          rowCountEstimate?: number;
          columns: Array<{
            name: string;
            dataType: string;
            isNullable: boolean;
            isPrimaryKey: boolean;
          }>;
        }>;
      };
    };

    const introspectedTables: DataTable[] = payload.data.tables.map((tbl) => ({
      id: `${config.id}:${tbl.schema}.${tbl.name}`,
      name: `${tbl.schema !== 'public' ? `${tbl.schema}.` : ''}${tbl.name}`,
      schema: tbl.schema,
      tableName: tbl.name,
      rowCountEstimate: tbl.rowCountEstimate,
      columns: tbl.columns.map((c) => ({
        name: c.name,
        type: mapPostgresTypeToCategory(c.dataType),
        rawType: c.dataType,
      })),
      rows: [],
      isLive: true,
    }));

    const source: DataSource = {
      id: config.id,
      name: `${config.name} (${config.database})`,
      type: 'postgres',
      tables: introspectedTables,
      connectionConfig: config,
      isConnected: true,
    };

    return { source };
  } catch (err) {
    return {
      source: {
        id: config.id,
        name: `${config.name} (${config.database})`,
        type: 'postgres',
        tables: [],
        connectionConfig: config,
        isConnected: false,
      },
      error: err instanceof Error ? err.message : 'Fallo de conexión de red al servidor API.',
    };
  }
}

/**
 * Runs a safe read-only SELECT query against a PostgreSQL database to fetch live rows.
 */
export async function fetchPostgresTableRows(
  config: ConnectionConfig,
  schema: string,
  tableName: string,
  limit = 100,
): Promise<{ rows: Record<string, unknown>[]; executionMs: number; error?: string }> {
  try {
    const sql = `SELECT * FROM "${schema}"."${tableName}" LIMIT ${limit}`;
    const res = await fetch('/api/queries/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connection: config,
        sql,
        limit,
        timeoutMs: 10000,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        rows: [],
        executionMs: 0,
        error: errJson?.error?.message || 'Error al consultar la tabla en PostgreSQL.',
      };
    }

    const payload = (await res.json()) as {
      data: {
        columns: Array<{ name: string; type: string }>;
        rows: unknown[][];
        rowCount: number;
        executionDurationMs: number;
      };
    };

    const rows: Record<string, unknown>[] = payload.data.rows.map((rowArr) => {
      const rowObj: Record<string, unknown> = {};
      payload.data.columns.forEach((col, idx) => {
        rowObj[col.name] = rowArr[idx];
      });
      return rowObj;
    });

    return {
      rows,
      executionMs: payload.data.executionDurationMs,
    };
  } catch (err) {
    return {
      rows: [],
      executionMs: 0,
      error: err instanceof Error ? err.message : 'Error inesperado al conectar con la API.',
    };
  }
}

// 1. Built-in PostgreSQL Demo Tables (matching infra/seeds/init-demo.sql)
export const demoPostgresSource: DataSource = {
  id: 'ds-postgres-demo',
  name: 'PostgreSQL: retail_demo',
  type: 'postgres',
  tables: [
    {
      id: 'tbl-products',
      name: 'products (Productos)',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'cost', type: 'number' },
        { name: 'stock', type: 'number' },
      ],
      rows: [
        { name: 'Monitor Ultrawide 34"', category: 'Tecnología', price: 499, cost: 310, stock: 45 },
        { name: 'Teclado Mecánico RGB', category: 'Tecnología', price: 89, cost: 45, stock: 120 },
        { name: 'Mouse Inalámbrico', category: 'Tecnología', price: 59, cost: 25, stock: 180 },
        { name: 'Auriculares Cancelación', category: 'Tecnología', price: 179, cost: 95, stock: 60 },
        { name: 'Silla Ergonómica', category: 'Oficina', price: 280, cost: 140, stock: 35 },
        { name: 'Escritorio Standing Desk', category: 'Oficina', price: 420, cost: 220, stock: 20 },
        { name: 'Lámpara LED Regulable', category: 'Oficina', price: 39, cost: 18, stock: 85 },
        { name: 'Auditoría de Datos (Bolsa 10h)', category: 'Servicios', price: 950, cost: 400, stock: 99 },
        { name: 'Mantenimiento Mensual', category: 'Servicios', price: 1400, cost: 600, stock: 99 },
      ],
    },
    {
      id: 'tbl-orders',
      name: 'orders (Ventas por País)',
      columns: [
        { name: 'shipping_country', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'total_amount', type: 'number' },
      ],
      rows: [
        { shipping_country: 'Ecuador', status: 'completed', total_amount: 1057 },
        { shipping_country: 'Argentina', status: 'completed', total_amount: 420 },
        { shipping_country: 'Chile', status: 'completed', total_amount: 678 },
        { shipping_country: 'Colombia', status: 'completed', total_amount: 2350 },
        { shipping_country: 'Brasil', status: 'completed', total_amount: 148 },
        { shipping_country: 'Ecuador', status: 'completed', total_amount: 899 },
        { shipping_country: 'Perú', status: 'completed', total_amount: 760 },
        { shipping_country: 'México', status: 'pending', total_amount: 499 },
        { shipping_country: 'Argentina', status: 'completed', total_amount: 1400 },
      ],
    },
    {
      id: 'tbl-financial',
      name: 'financial_accounts (Plan de Cuentas)',
      columns: [
        { name: 'code', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'account_type', type: 'string' },
        { name: 'balance', type: 'number' },
      ],
      rows: [
        { code: '1', name: 'ACTIVO', account_type: 'Activo', balance: 485000 },
        { code: '11', name: 'Activo Corriente', account_type: 'Activo', balance: 310000 },
        { code: '111', name: 'Disponible', account_type: 'Activo', balance: 145000 },
        { code: '11101', name: 'Caja General', account_type: 'Activo', balance: 25000 },
        { code: '11102', name: 'Bancos Nacionales', account_type: 'Activo', balance: 120000 },
        { code: '2', name: 'PASIVO', account_type: 'Pasivo', balance: 195000 },
        { code: '21', name: 'Pasivo Corriente', account_type: 'Pasivo', balance: 115000 },
        { code: '3', name: 'PATRIMONIO', account_type: 'Patrimonio', balance: 290000 },
      ],
    },
  ],
};

// 2. Parse uploaded Excel or CSV file with smart header detection and accounting hierarchy derivation
export function cleanNumericValue(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]/g, '').trim();
    if (!cleaned) return 0;
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function formatPotentialDate(val: unknown, colName: string): unknown {
  const isDateColumn = /fecha|date|dia|timestamp/i.test(colName);
  if (!isDateColumn) return val;

  if (typeof val === 'number' && val > 20000 && val < 70000) {
    try {
      return XLSX.SSF.format('yyyy-mm-dd', val);
    } catch {
      return val;
    }
  }
  return val;
}

export function findHeaderRowIndex(sheetMatrix: readonly unknown[][]): number {
  let bestIndex = 0;
  let maxScore = -1;

  for (let i = 0; i < Math.min(12, sheetMatrix.length); i++) {
    const row = sheetMatrix[i] || [];
    const headerCandidates = row.filter((cell) => {
      if (typeof cell !== 'string') return false;
      const trimmed = cell.trim();
      return trimmed.length >= 2 && trimmed.length <= 80 && isNaN(Number(trimmed));
    });

    const score = headerCandidates.length;
    const nextRow = sheetMatrix[i + 1] || [];
    const hasData = nextRow.some((c) => c !== null && c !== undefined && c !== '');
    const totalScore = score * 2 + (hasData && score >= 2 ? 3 : 0);

    if (totalScore > maxScore) {
      maxScore = totalScore;
      bestIndex = i;
    }
  }

  return bestIndex;
}

interface DetectedAccountingCols {
  readonly codeCol?: string;
  readonly descCol?: string;
  readonly debitCol?: string;
  readonly creditCol?: string;
  readonly balanceCol?: string;
}

export function detectAccountingColumns(columnNames: readonly string[]): DetectedAccountingCols {
  let codeCol: string | undefined;
  let descCol: string | undefined;
  let debitCol: string | undefined;
  let creditCol: string | undefined;
  let balanceCol: string | undefined;

  for (const name of columnNames) {
    const lower = name.toLowerCase().trim();
    if (!codeCol && (/c[oó]digo|code/i.test(lower) || (lower === 'cuenta' && !descCol))) {
      codeCol = name;
    } else if (!debitCol && /debe|d[eé]bito|debit/i.test(lower)) {
      debitCol = name;
    } else if (!creditCol && /haber|cr[eé]dito|credit/i.test(lower)) {
      creditCol = name;
    } else if (!balanceCol && /saldo|balance|monto/i.test(lower)) {
      balanceCol = name;
    } else if (!descCol && /glosa|descrip|nombre|concepto|detalle/i.test(lower)) {
      descCol = name;
    } else if (!descCol && lower === 'cuenta') {
      descCol = name;
    }
  }

  return { codeCol, descCol, debitCol, creditCol, balanceCol };
}

const KNOWN_ACCOUNT_NAMES: Record<string, string> = {
  '1': 'ACTIVOS',
  '2': 'PASIVOS Y PATRIMONIO',
  '3': 'PATRIMONIO',
  '4': 'INGRESOS',
  '5': 'COSTOS',
  '6': 'GASTOS',
  '11': 'Activo Corriente',
  '1.1': 'Activo Corriente',
  '12': 'Activo No Corriente',
  '1.2': 'Activo No Corriente',
  '21': 'Pasivo Corriente',
  '2.1': 'Pasivo Corriente',
  '22': 'Pasivo No Corriente',
  '2.2': 'Pasivo No Corriente',
  '31': 'Capital Social y Reservas',
  '3.1': 'Capital Social y Reservas',
  '41': 'Ingresos Operacionales',
  '4.1': 'Ingresos Operacionales',
  '51': 'Costos Operacionales',
  '5.1': 'Costos Operacionales',
  '61': 'Gastos Operativos',
  '6.1': 'Gastos Operativos',
};

export function deriveAccountHierarchy(
  accountCode: string,
): { level: number; hierarchyType: string; cleanCode: string } {
  const cleanCode = accountCode.replace(/[^0-9a-zA-Z]/g, '');
  const hasDots = accountCode.includes('.');

  let level = 1;
  if (hasDots) {
    level = accountCode.split('.').length;
  } else {
    if (cleanCode.length === 1) level = 1;
    else if (cleanCode.length === 2) level = 2;
    else if (cleanCode.length <= 4) level = 3;
    else level = 4;
  }

  let hierarchyType = 'Padre (Nivel 1)';
  if (level === 2) hierarchyType = 'Hijo (Nivel 2)';
  else if (level === 3) hierarchyType = 'Nieto (Nivel 3)';
  else if (level >= 4) hierarchyType = 'Subcuenta / Tataranieto (Nivel 4+)';

  return { level, hierarchyType, cleanCode };
}

export function deriveHierarchicalRollupTable(
  fileId: string,
  rawTables: readonly DataTable[],
): DataTable | null {
  // Find a table with accounting columns
  let targetTable: DataTable | null = null;
  let detectedCols: DetectedAccountingCols | null = null;

  for (const tbl of rawTables) {
    const colNames = tbl.columns.map((c) => c.name);
    const cols = detectAccountingColumns(colNames);
    if (cols.codeCol && ((cols.debitCol && cols.creditCol) || cols.balanceCol)) {
      targetTable = tbl;
      detectedCols = cols;
      break;
    }
  }

  if (!targetTable || !detectedCols || !detectedCols.codeCol) {
    return null;
  }

  // Collect known account names from any other catalog sheets if available
  const catalogNames = new Map<string, string>();
  for (const tbl of rawTables) {
    const colNames = tbl.columns.map((c) => c.name);
    const codeCol = colNames.find((c) => /c[oó]digo|code/i.test(c));
    const nameCol = colNames.find((c) => /nombre|cuenta/i.test(c) && !/tipo|subtipo/i.test(c));
    if (codeCol && nameCol && tbl !== targetTable) {
      for (const row of tbl.rows) {
        const code = String(row[codeCol] ?? '').trim();
        const name = String(row[nameCol] ?? '').trim();
        if (code && name) {
          catalogNames.set(code, name);
          catalogNames.set(code.replace(/[^0-9a-zA-Z]/g, ''), name);
        }
      }
    }
  }

  const { codeCol, descCol, debitCol, creditCol, balanceCol } = detectedCols;

  interface AccountNode {
    code: string;
    cleanCode: string;
    name: string;
    directDebe: number;
    directHaber: number;
    directBalance: number;
    level: number;
    hierarchyType: string;
  }

  const accountMap = new Map<string, AccountNode>();

  for (const row of targetTable.rows) {
    const rawCode = row[codeCol];
    if (rawCode === undefined || rawCode === null || String(rawCode).trim() === '') continue;
    const code = String(rawCode).trim();
    const cleanCode = code.replace(/[^0-9a-zA-Z]/g, '');
    if (!cleanCode) continue;

    const desc = descCol && row[descCol] ? String(row[descCol]).trim() : '';
    const debe = debitCol ? cleanNumericValue(row[debitCol]) : 0;
    const haber = creditCol ? cleanNumericValue(row[creditCol]) : 0;
    const bal = balanceCol ? cleanNumericValue(row[balanceCol]) : debe - haber;

    const { level, hierarchyType } = deriveAccountHierarchy(code);

    if (!accountMap.has(code)) {
      const knownName =
        catalogNames.get(code) ||
        catalogNames.get(cleanCode) ||
        KNOWN_ACCOUNT_NAMES[code] ||
        KNOWN_ACCOUNT_NAMES[cleanCode] ||
        desc ||
        `Cuenta ${code}`;

      accountMap.set(code, {
        code,
        cleanCode,
        name: knownName,
        directDebe: 0,
        directHaber: 0,
        directBalance: 0,
        level,
        hierarchyType,
      });
    }

    const acc = accountMap.get(code)!;
    acc.directDebe += debe;
    acc.directHaber += haber;
    acc.directBalance += bal;
    if (desc && (!acc.name || acc.name.startsWith('Cuenta '))) {
      acc.name = desc;
    }
  }

  // Synthesize standard parent prefixes if missing from entries (e.g. 1 -> 11 -> 111)
  const existingNodes = Array.from(accountMap.values());
  for (const node of existingNodes) {
    const hasDots = node.code.includes('.');
    const parentCandidates: string[] = [];

    if (hasDots) {
      const parts = node.code.split('.');
      for (let i = 1; i < parts.length; i++) {
        parentCandidates.push(parts.slice(0, i).join('.'));
      }
    } else {
      for (let len = 1; len <= Math.min(3, node.cleanCode.length - 1); len++) {
        parentCandidates.push(node.cleanCode.substring(0, len));
      }
    }

    for (const pCode of parentCandidates) {
      if (!accountMap.has(pCode)) {
        const pClean = pCode.replace(/[^0-9a-zA-Z]/g, '');
        const { level, hierarchyType } = deriveAccountHierarchy(pCode);
        const pName =
          catalogNames.get(pCode) ||
          catalogNames.get(pClean) ||
          KNOWN_ACCOUNT_NAMES[pCode] ||
          KNOWN_ACCOUNT_NAMES[pClean] ||
          `Grupo ${pCode}`;

        accountMap.set(pCode, {
          code: pCode,
          cleanCode: pClean,
          name: pName,
          directDebe: 0,
          directHaber: 0,
          directBalance: 0,
          level,
          hierarchyType,
        });
      }
    }
  }

  // Perform Rollup: for each parent account P, sum all descendants C where C starts with P
  const allNodes = Array.from(accountMap.values());
  const rollupRows: Record<string, unknown>[] = allNodes.map((p) => {
    let totalDebe = 0;
    let totalHaber = 0;
    let totalSaldo = 0;

    for (const c of allNodes) {
      if (c.cleanCode.startsWith(p.cleanCode)) {
        totalDebe += c.directDebe;
        totalHaber += c.directHaber;
        totalSaldo += c.directBalance;
      }
    }

    return {
      codigo: p.code,
      cuenta: p.name,
      nivel: p.level,
      tipo_jerarquia: p.hierarchyType,
      total_debe: Math.round(totalDebe * 100) / 100,
      total_haber: Math.round(totalHaber * 100) / 100,
      saldo_rollup: Math.round(totalSaldo * 100) / 100,
      movimiento_directo: Math.round(p.directBalance * 100) / 100,
    };
  });

  rollupRows.sort((a, b) => {
    const codeA = String(a.codigo).replace(/[^0-9a-zA-Z]/g, '');
    const codeB = String(b.codigo).replace(/[^0-9a-zA-Z]/g, '');
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });

  const columns: DataColumn[] = [
    { name: 'codigo', type: 'string' },
    { name: 'cuenta', type: 'string' },
    { name: 'nivel', type: 'number' },
    { name: 'tipo_jerarquia', type: 'string' },
    { name: 'total_debe', type: 'number' },
    { name: 'total_haber', type: 'number' },
    { name: 'saldo_rollup', type: 'number' },
    { name: 'movimiento_directo', type: 'number' },
  ];

  return {
    id: `tbl-${fileId}-balance-jerarquico`,
    name: 'Balance General (Jerárquico)',
    columns,
    rows: rollupRows,
  };
}

export const parseUploadedExcel = async (file: File): Promise<DataSource> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const tables: DataTable[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to 2D matrix to identify best header row
    const sheetMatrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
    if (sheetMatrix.length === 0) continue;

    const headerIdx = findHeaderRowIndex(sheetMatrix);
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      range: headerIdx,
      defval: '',
    });
    if (rawRows.length === 0) continue;

    // Identify and filter valid columns (omit empty or unlabelled columns)
    const firstRow = rawRows[0] ?? {};
    const validColNames = Object.keys(firstRow).filter((colName) => {
      const trimmed = colName.trim();
      return trimmed.length > 0 && !trimmed.startsWith('__EMPTY');
    });

    if (validColNames.length === 0) continue;

    // Determine column types and format dates
    const columns: DataColumn[] = validColNames.map((colName) => {
      let numCount = 0;
      let totalCount = 0;
      const isDateCol = /fecha|date|dia/i.test(colName);

      for (const row of rawRows.slice(0, 50)) {
        const val = row[colName];
        if (val !== undefined && val !== null && val !== '') {
          totalCount++;
          if (typeof val === 'number' || (!isNaN(Number(val)) && !isDateCol)) {
            numCount++;
          }
        }
      }

      let type: DataColumn['type'] = 'string';
      if (isDateCol) {
        type = 'date';
      } else if (totalCount > 0 && numCount / totalCount >= 0.7) {
        type = 'number';
      }

      return {
        name: colName,
        type,
      };
    });

    // Clean rows: format dates and prune empty keys
    const cleanedRows = rawRows.map((row) => {
      const cleanRow: Record<string, unknown> = {};
      for (const col of columns) {
        let val = row[col.name];
        if (col.type === 'date') {
          val = formatPotentialDate(val, col.name);
        } else if (col.type === 'number') {
          val = cleanNumericValue(val);
        }
        cleanRow[col.name] = val;
      }
      return cleanRow;
    });

    tables.push({
      id: `tbl-${file.name}-${sheetName}`,
      name: sheetName,
      columns,
      rows: cleanedRows,
    });
  }

  // Derive hierarchical balance sheet if accounting columns exist
  const hierarchicalTable = deriveHierarchicalRollupTable(String(Date.now()), tables);
  if (hierarchicalTable) {
    tables.unshift(hierarchicalTable);
  }

  return {
    id: `ds-${Date.now()}`,
    name: file.name,
    type: file.name.endsWith('.csv') ? 'csv' : 'excel',
    tables,
  };
};

// 3. Real In-Memory Aggregation Function
export interface AggregationResult {
  readonly categories: readonly string[];
  readonly values: readonly number[];
  readonly totalSum: number;
}

export const aggregateData = (
  rows: readonly Record<string, unknown>[],
  xField: string,
  yField: string,
  aggFn: 'sum' | 'count' | 'avg' | 'min' | 'max' = 'sum',
): AggregationResult => {
  const groupMap = new Map<string, number[]>();

  for (const row of rows) {
    const key = String(row[xField] ?? 'Sin categoría');
    const rawVal = Number(row[yField]);
    const numVal = isNaN(rawVal) ? (aggFn === 'count' ? 1 : 0) : rawVal;

    const list = groupMap.get(key) || [];
    list.push(numVal);
    groupMap.set(key, list);
  }

  const categories: string[] = [];
  const values: number[] = [];
  let totalSum = 0;

  for (const [cat, numList] of groupMap.entries()) {
    categories.push(cat);
    let val = 0;

    switch (aggFn) {
      case 'count':
        val = numList.length;
        break;
      case 'sum':
        val = numList.reduce((acc, n) => acc + n, 0);
        break;
      case 'avg':
        val = numList.length > 0 ? numList.reduce((acc, n) => acc + n, 0) / numList.length : 0;
        break;
      case 'min':
        val = numList.length > 0 ? Math.min(...numList) : 0;
        break;
      case 'max':
        val = numList.length > 0 ? Math.max(...numList) : 0;
        break;
    }

    const rounded = Math.round(val * 100) / 100;
    values.push(rounded);
    totalSum += rounded;
  }

  return {
    categories,
    values,
    totalSum: Math.round(totalSum * 100) / 100,
  };
};
