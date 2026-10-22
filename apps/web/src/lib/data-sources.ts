import * as XLSX from 'xlsx';

export interface DataColumn {
  readonly name: string;
  readonly type: 'string' | 'number' | 'date';
}

export interface DataTable {
  readonly id: string;
  readonly name: string;
  readonly columns: readonly DataColumn[];
  readonly rows: readonly Record<string, unknown>[];
}

export interface DataSource {
  readonly id: string;
  readonly name: string;
  readonly type: 'postgres' | 'excel' | 'csv';
  readonly tables: readonly DataTable[];
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

// 2. Parse uploaded Excel or CSV file
export const parseUploadedExcel = async (file: File): Promise<DataSource> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const tables: DataTable[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    if (rawRows.length === 0) continue;

    // Detect column types
    const firstRow = rawRows[0] ?? {};
    const columns: DataColumn[] = Object.keys(firstRow).map((colName) => {
      const sampleVal = firstRow[colName];
      const type: DataColumn['type'] = typeof sampleVal === 'number' ? 'number' : 'string';
      return {
        name: colName,
        type,
      };
    });

    tables.push({
      id: `tbl-${file.name}-${sheetName}`,
      name: sheetName,
      columns,
      rows: rawRows,
    });
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
