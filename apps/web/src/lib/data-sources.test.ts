import { describe, it, expect } from 'vitest';
import {
  findHeaderRowIndex,
  cleanNumericValue,
  detectAccountingColumns,
  deriveAccountHierarchy,
  deriveHierarchicalRollupTable,
  type DataTable,
} from './data-sources';

describe('Excel Accounting Rollup and Smart Parsing', () => {
  it('detects header row skipping title banners and blank rows', () => {
    const rawMatrix = [
      ['SISTEMA CONTABLE AUTOMATIZADO - CATÁLOGO'],
      ['Base de datos de demostración'],
      [],
      ['Código Cuenta', 'Nombre de la Cuenta', 'Debe', 'Haber'],
      ['1.1.01', 'Caja y Bancos', 50000, 0],
    ];

    const idx = findHeaderRowIndex(rawMatrix);
    expect(idx).toBe(3);
  });

  it('correctly cleans numeric values with currency and commas', () => {
    expect(cleanNumericValue('$50,000')).toBe(50000);
    expect(cleanNumericValue('1,250.75')).toBe(1250.75);
    expect(cleanNumericValue(300)).toBe(300);
    expect(cleanNumericValue('')).toBe(0);
    expect(cleanNumericValue(null)).toBe(0);
  });

  it('detects accounting column variants (Spanish and English)', () => {
    const cols = ['Fecha', 'Asiento N°', 'Código Cuenta', 'Glosa / Descripción', 'Debe (Débito)', 'Haber (Crédito)'];
    const detected = detectAccountingColumns(cols);

    expect(detected.codeCol).toBe('Código Cuenta');
    expect(detected.descCol).toBe('Glosa / Descripción');
    expect(detected.debitCol).toBe('Debe (Débito)');
    expect(detected.creditCol).toBe('Haber (Crédito)');
  });

  it('correctly maps account levels and hierarchy types', () => {
    expect(deriveAccountHierarchy('1')).toEqual({ level: 1, hierarchyType: 'Padre (Nivel 1)', cleanCode: '1' });
    expect(deriveAccountHierarchy('11')).toEqual({ level: 2, hierarchyType: 'Hijo (Nivel 2)', cleanCode: '11' });
    expect(deriveAccountHierarchy('111')).toEqual({ level: 3, hierarchyType: 'Nieto (Nivel 3)', cleanCode: '111' });
    expect(deriveAccountHierarchy('111001')).toEqual({ level: 4, hierarchyType: 'Subcuenta / Tataranieto (Nivel 4+)', cleanCode: '111001' });
    expect(deriveAccountHierarchy('1.1.01')).toEqual({ level: 3, hierarchyType: 'Nieto (Nivel 3)', cleanCode: '1101' });
  });

  it('computes hierarchical accounting rollup across multiple levels (Padre > Hijo > Nieto > Tataranieto)', () => {
    const mockJournalTable: DataTable = {
      id: 'tbl-journal',
      name: 'Libro Diario',
      columns: [
        { name: 'Código Cuenta', type: 'string' },
        { name: 'Glosa / Descripción', type: 'string' },
        { name: 'Debe (Débito)', type: 'number' },
        { name: 'Haber (Crédito)', type: 'number' },
      ],
      rows: [
        // Tataranieto 111001 with 3 transactions totaling 50,000
        { 'Código Cuenta': '111001', 'Glosa / Descripción': 'Ventas dia 15', 'Debe (Débito)': 25000, 'Haber (Crédito)': 0 },
        { 'Código Cuenta': '111001', 'Glosa / Descripción': 'Ventas dia 16', 'Debe (Débito)': 10000, 'Haber (Crédito)': 0 },
        { 'Código Cuenta': '111001', 'Glosa / Descripción': 'Ventas dia 17', 'Debe (Débito)': 15000, 'Haber (Crédito)': 0 },
        // Direct movement on Nieto 111
        { 'Código Cuenta': '111', 'Glosa / Descripción': 'Pago arriendo', 'Debe (Débito)': 0, 'Haber (Crédito)': 1500 },
        // Other accounts
        { 'Código Cuenta': '112', 'Glosa / Descripción': 'Maquinaria', 'Debe (Débito)': 15000, 'Haber (Crédito)': 0 },
        { 'Código Cuenta': '12', 'Glosa / Descripción': 'Activo No Corriente', 'Debe (Débito)': 20000, 'Haber (Crédito)': 0 },
      ],
    };

    const rollupTable = deriveHierarchicalRollupTable('test-file', [mockJournalTable]);
    expect(rollupTable).not.toBeNull();
    if (!rollupTable) return;

    expect(rollupTable.name).toBe('Balance General (Jerárquico)');

    const rows = rollupTable.rows;
    const findRow = (code: string) => rows.find((r) => r.codigo === code);

    // Tataranieto 111001: 50,000
    const tataranieto = findRow('111001');
    expect(tataranieto).toBeDefined();
    expect(tataranieto?.saldo_rollup).toBe(50000);
    expect(tataranieto?.tipo_jerarquia).toBe('Subcuenta / Tataranieto (Nivel 4+)');

    // Nieto 111: includes 111001 (50,000) - 1,500 = 48,500
    const nieto = findRow('111');
    expect(nieto).toBeDefined();
    expect(nieto?.saldo_rollup).toBe(48500);

    // Hijo 11 (Activo Corriente): includes 111 (48,500) + 112 (15,000) = 63,500
    const hijo11 = findRow('11');
    expect(hijo11).toBeDefined();
    expect(hijo11?.saldo_rollup).toBe(63500);

    // Padre 1 (ACTIVOS): includes 11 (63,500) + 12 (20,000) = 83,500
    const padre1 = findRow('1');
    expect(padre1).toBeDefined();
    expect(padre1?.saldo_rollup).toBe(83500);

    // Verify strict hierarchical lexicographical ordering (children sit before next sibling group)
    const codeOrder = rows.map((r) => r.codigo);
    expect(codeOrder).toEqual(['1', '11', '111', '111001', '112', '12']);
  });
});
