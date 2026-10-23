'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Columns,
  Download,
  Edit2,
  List,
  Plus,
  Printer,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';

export type FinancialTheme = 'classic_blue' | 'corporate_navy' | 'emerald_finance' | 'minimal_slate';

export interface FinancialLineItem {
  id: string;
  label: string;
  values: Record<string, number | null>;
  isSubtotal?: boolean;
  isMajorTotal?: boolean;
  isNetIncome?: boolean;
  indentLevel?: number; // 0, 1, 2
  note?: string;
}

export interface FinancialSubSection {
  id: string;
  title: string;
  items: FinancialLineItem[];
  subtotal?: FinancialLineItem;
}

export interface FinancialSection {
  id: string;
  title: string;
  subSections?: FinancialSubSection[];
  items?: FinancialLineItem[];
  subtotal?: FinancialLineItem;
}

export interface FinancialStatementData {
  companyName: string;
  address: string;
  phone: string;
  reportTitle: string;
  preparedDate: string;
  startYear: string;
  endYear: string;
  periods: string[];
  currencySymbol: string;
  sections: FinancialSection[];
  bottomLines?: FinancialLineItem[];
}

export const defaultPnlStatementData: FinancialStatementData = {
  companyName: "Millie's Car Rentals",
  address: '1234 MLK Jr. Blvd, Seattle, WA 98116',
  phone: 'Teléfono: (206) 555-1212',
  reportTitle: 'PLANTILLA DE EJEMPLO DE GANANCIAS Y PÉRDIDAS ANUALES',
  preparedDate: '01-01-2030',
  startYear: '2025',
  endYear: '2029',
  periods: ['2025', '2026', '2027', '2028', '2029'],
  currencySymbol: '$',
  sections: [
    {
      id: 'sec-ingresos',
      title: 'INGRESOS',
      items: [
        {
          id: 'ventas-brutas',
          label: 'Ventas brutas',
          values: { '2025': 19130.0, '2026': 30225.4, '2027': 47756.13, '2028': 75454.69, '2029': 119218.41 },
          indentLevel: 0,
        },
        {
          id: 'devoluciones',
          label: 'Menos devoluciones y descuentos de ventas',
          values: { '2025': 0, '2026': 0, '2027': 0, '2028': 0, '2029': 0 },
          indentLevel: 1,
        },
      ],
      subtotal: {
        id: 'ventas-netas',
        label: 'VENTAS NETAS',
        values: { '2025': 19130.0, '2026': 30225.4, '2027': 47756.13, '2028': 75454.69, '2029': 119218.41 },
        isSubtotal: true,
      },
    },
    {
      id: 'sec-costo-ventas',
      title: 'COSTO DE VENTAS',
      items: [
        {
          id: 'inv-inicial',
          label: 'Inventario inicial',
          values: { '2025': 300.0, '2026': 310.0, '2027': 320.0, '2028': 330.0, '2029': 340.0 },
          indentLevel: 0,
        },
        {
          id: 'compras',
          label: 'Más bienes comprados o fabricados',
          values: { '2025': 100.0, '2026': 120.0, '2027': 140.0, '2028': 160.0, '2029': 170.0 },
          indentLevel: 1,
        },
        {
          id: 'bienes-disp',
          label: 'TOTAL DE BIENES DISPONIBLES',
          values: { '2025': 400.0, '2026': 430.0, '2027': 460.0, '2028': 490.0, '2029': 510.0 },
          isSubtotal: true,
          indentLevel: 0,
        },
        {
          id: 'inv-final',
          label: 'Menos inventario final',
          values: { '2025': 200.0, '2026': 250.0, '2027': 300.0, '2028': 350.0, '2029': 350.0 },
          indentLevel: 1,
        },
        {
          id: 'cogs',
          label: 'COSTO TOTAL DE LOS BIENES VENDIDOS (COGS)',
          values: { '2025': 200.0, '2026': 180.0, '2027': 160.0, '2028': 140.0, '2029': 160.0 },
          isSubtotal: true,
        },
      ],
      subtotal: {
        id: 'ganancia-bruta',
        label: 'GANANCIA BRUTA (PÉRDIDA)',
        values: { '2025': 18930.0, '2026': 30045.4, '2027': 47596.13, '2028': 75314.69, '2029': 119058.41 },
        isMajorTotal: true,
      },
    },
    {
      id: 'sec-gastos-operativos',
      title: 'GASTOS OPERATIVOS',
      subSections: [
        {
          id: 'subsec-venta',
          title: 'VENTA',
          items: [
            {
              id: 'salarios-venta',
              label: 'Salarios y remuneraciones',
              values: { '2025': 700.0, '2026': 735.0, '2027': 771.75, '2028': 810.34, '2029': 850.85 },
              indentLevel: 1,
            },
            {
              id: 'comisiones',
              label: 'Comisiones',
              values: { '2025': 10.0, '2026': 10.5, '2027': 11.03, '2028': 11.58, '2029': 12.16 },
              indentLevel: 1,
            },
            {
              id: 'publicidad',
              label: 'Publicidad',
              values: { '2025': 500.0, '2026': 525.0, '2027': 551.25, '2028': 578.81, '2029': 607.75 },
              indentLevel: 1,
            },
            {
              id: 'depreciacion',
              label: 'Depreciación',
              values: { '2025': 20.0, '2026': 24.0, '2027': 28.8, '2028': 34.56, '2029': 41.47 },
              indentLevel: 1,
            },
            {
              id: 'otros-venta',
              label: 'Otros',
              note: '(p. ej., honorarios profesionales)',
              values: { '2025': 0, '2026': 0, '2027': 0, '2028': 0, '2029': 0 },
              indentLevel: 1,
            },
          ],
          subtotal: {
            id: 'total-gastos-venta',
            label: 'TOTAL DE GASTOS DE VENTA',
            values: { '2025': 1230.0, '2026': 1294.5, '2027': 1362.83, '2028': 1435.29, '2029': 1512.23 },
            isSubtotal: true,
          },
        },
        {
          id: 'subsec-admin',
          title: 'GENERAL Y ADMINISTRACIÓN',
          items: [
            {
              id: 'salarios-admin',
              label: 'Salarios y remuneraciones',
              values: { '2025': 200.0, '2026': 210.0, '2027': 220.5, '2028': 231.53, '2029': 243.1 },
              indentLevel: 1,
            },
            {
              id: 'beneficios',
              label: 'Beneficios de los empleados',
              values: { '2025': 3.0, '2026': 3.15, '2027': 3.31, '2028': 3.47, '2029': 3.65 },
              indentLevel: 1,
            },
            {
              id: 'impuestos-nominas',
              label: 'Impuestos sobre las nóminas',
              values: { '2025': 1.0, '2026': 2.0, '2027': 3.0, '2028': 4.0, '2029': 4.0 },
              indentLevel: 1,
            },
            {
              id: 'seguros',
              label: 'Seguros',
              values: { '2025': 400.0, '2026': 420.0, '2027': 441.0, '2028': 463.05, '2029': 486.2 },
              indentLevel: 1,
            },
          ],
          subtotal: {
            id: 'total-gastos-admin',
            label: 'TOTAL DE GASTOS GENERALES Y DE ADMINISTRACIÓN',
            values: { '2025': 604.0, '2026': 635.15, '2027': 667.81, '2028': 702.05, '2029': 736.95 },
            isSubtotal: true,
          },
        },
      ],
      subtotal: {
        id: 'gastos-operativos-totales',
        label: 'GASTOS OPERATIVOS TOTALES',
        values: { '2025': 1834.0, '2026': 1929.65, '2027': 2030.63, '2028': 2137.33, '2029': 2249.18 },
        isMajorTotal: true,
      },
    },
    {
      id: 'sec-resultados-impuestos',
      title: 'RESULTADOS & IMPUESTOS',
      items: [
        {
          id: 'ingresos-antes-impuestos',
          label: 'INGRESOS NETOS ANTES DE IMPUESTOS',
          values: { '2025': 17096.0, '2026': 28115.75, '2027': 45565.5, '2028': 73177.35, '2029': 116809.22 },
          isMajorTotal: true,
          indentLevel: 0,
        },
        {
          id: 'impuesto-renta',
          label: 'Impuestos sobre la renta',
          values: { '2025': 3419.2, '2026': 5623.15, '2027': 9113.1, '2028': 14635.47, '2029': 23361.84 },
          indentLevel: 1,
        },
        {
          id: 'ingresos-despues-impuestos',
          label: 'INGRESOS NETOS DESPUÉS DE IMPUESTOS',
          values: { '2025': 13676.8, '2026': 22492.6, '2027': 36452.4, '2028': 58541.88, '2029': 93447.38 },
          isSubtotal: true,
          indentLevel: 0,
        },
        {
          id: 'extraordinarias-ganancias',
          label: 'Ganancias o pérdidas extraordinarias',
          values: { '2025': 19.0, '2026': 0, '2027': 10.0, '2028': 0, '2029': 0 },
          indentLevel: 1,
        },
        {
          id: 'extraordinarias-impuestos',
          label: 'Impuesto sobre las ganancias extraordinarias',
          values: { '2025': 3.0, '2026': 0, '2027': 2.0, '2028': 0, '2029': 0 },
          indentLevel: 1,
        },
      ],
      subtotal: {
        id: 'ingresos-netos-final',
        label: 'INGRESOS NETOS (PÉRDIDAS)',
        values: { '2025': 13692.8, '2026': 22492.6, '2027': 36460.4, '2028': 58541.88, '2029': 93447.38 },
        isNetIncome: true,
      },
    },
  ],
};

export function parseAccountLabel(label: string): { code?: string; name: string } {
  const match = label.match(/^([0-9A-Za-z]+)\s*[-:]\s*(.+)$/);
  if (match && match[1] && match[2]) {
    return { code: match[1], name: match[2].trim() };
  }
  return { name: label };
}

/**
 * Intelligent generator: converts real table rows into a structured Financial Statement
 */
export function buildStatementFromActualRows(
  rows: readonly Record<string, unknown>[],
  tableName?: string,
  sourceName?: string,
): FinancialStatementData {
  if (!rows || rows.length === 0) {
    return {
      companyName: sourceName ? `Empresa: ${sourceName}` : 'Mi Empresa',
      address: 'Sede Principal • Departamento de Contabilidad',
      phone: 'Informe Contable Consolidado',
      reportTitle: tableName ? tableName.toUpperCase() : 'ESTADO FINANCIERO',
      preparedDate: new Date().toLocaleDateString('es-ES'),
      startYear: '2026',
      endYear: '2026',
      periods: ['Saldo Actual'],
      currencySymbol: '$',
      sections: [
        {
          id: 'sec-1',
          title: '1. ACTIVOS',
          items: [
            {
              id: 'row-1',
              label: '11 - Activo Corriente / Disponible',
              values: { 'Saldo Actual': 0 },
              indentLevel: 1,
            },
          ],
          subtotal: {
            id: 'sub-1',
            label: 'TOTAL ACTIVOS',
            values: { 'Saldo Actual': 0 },
            isMajorTotal: true,
          },
        },
      ],
    };
  }

  // Detect fields
  const sample = rows[0] || {};
  const keys = Object.keys(sample);

  const codeKey = keys.find((k) => /c[oó]digo|code/i.test(k));
  const nameKey = keys.find((k) => /cuenta|nombre|glosa|descrip|concepto/i.test(k) && !/tipo|subtipo/i.test(k));
  const balanceKey = keys.find((k) => /saldo_rollup|balance_acumulado|saldo_final|saldo|balance|monto|total|haber_acumulado|debe_acumulado/i.test(k));
  const levelKey = keys.find((k) => /nivel|level/i.test(k));

  // If no accounting code found, create a simple dynamic category breakdown
  if (!codeKey && !nameKey) {
    return defaultPnlStatementData;
  }

  // Store root account balances separately to prevent double-counting
  const rootBalances = new Map<string, number>();
  const sectionMap = new Map<string, { title: string; rootChar: string; items: FinancialLineItem[] }>();

  const SECTION_CONFIGS = [
    { root: '1', title: '1. ACTIVOS' },
    { root: '2', title: '2. PASIVOS' },
    { root: '3', title: '3. PATRIMONIO NETO' },
    { root: '4', title: '4. INGRESOS' },
    { root: '5', title: '5. COSTOS DE VENTA' },
    { root: '6', title: '6. GASTOS OPERATIVOS' },
  ];

  rows.forEach((row, idx) => {
    const rawCode = codeKey ? String(row[codeKey] ?? '').trim() : '';
    const cleanCode = rawCode.replace(/[^0-9a-zA-Z]/g, '');
    const rawName = nameKey ? String(row[nameKey] ?? '').trim() : `Cuenta ${idx + 1}`;
    const rawVal = balanceKey && row[balanceKey] !== undefined ? Number(row[balanceKey]) : 0;
    const numVal = isNaN(rawVal) ? 0 : rawVal;

    const rootChar = cleanCode.charAt(0) || '1';

    // In accounting: Pasivos (2), Patrimonio (3), and Ingresos (4) are credit accounts,
    // so if they are negative (Debe - Haber), present them as positive magnitude.
    const displayVal =
      rootChar === '2' || rootChar === '3' || rootChar === '4'
        ? Math.abs(numVal)
        : numVal;

    // Check if this row is the ROOT account itself (e.g. '1', '2', '3')
    if (cleanCode.length === 1 || cleanCode === rootChar) {
      rootBalances.set(rootChar, displayVal);
      // Do NOT add the root row itself as an item inside the section to prevent double-counting
      return;
    }

    const cfg = SECTION_CONFIGS.find((c) => c.root === rootChar);
    const secTitle = cfg ? cfg.title : 'CUENTAS GENERALES';

    if (!sectionMap.has(secTitle)) {
      sectionMap.set(secTitle, { title: secTitle, rootChar, items: [] });
    }

    const rawLevel = levelKey && row[levelKey] !== undefined ? Number(row[levelKey]) : 1;
    // Indent levels: level 2 -> indent 0 (Group), level 3 -> indent 1 (Major), level 4+ -> indent 2 (Detail)
    const indentLevel = Math.max(
      0,
      Math.min(2, isNaN(rawLevel) ? (cleanCode.length > 2 ? 1 : 0) : rawLevel - 2),
    );

    sectionMap.get(secTitle)?.items.push({
      id: `row-${idx}-${rawCode}`,
      label: rawCode ? `${rawCode} - ${rawName}` : rawName,
      values: { 'Saldo Registrado': displayVal },
      indentLevel,
      isSubtotal: rawLevel === 2 || cleanCode.length === 2,
    });
  });

  const sections: FinancialSection[] = [];
  SECTION_CONFIGS.forEach(({ root, title }) => {
    const dataGroup = sectionMap.get(title);
    if (!dataGroup || dataGroup.items.length === 0) return;

    // Strict hierarchical lexicographical code sort so children sit directly underneath parent group
    dataGroup.items.sort((a, b) => {
      const codeA = (a.id.match(/row-\d+-(.*)/)?.[1] || a.label).replace(/[^0-9a-zA-Z]/g, '');
      const codeB = (b.id.match(/row-\d+-(.*)/)?.[1] || b.label).replace(/[^0-9a-zA-Z]/g, '');
      return codeA.localeCompare(codeB);
    });

    // Subtotal: use the root rollup balance if available, otherwise sum top-level items
    let sectionTotal = rootBalances.get(root);
    if (sectionTotal === undefined) {
      const topItems = dataGroup.items.filter((it) => it.indentLevel === 0);
      sectionTotal = (topItems.length > 0 ? topItems : dataGroup.items).reduce(
        (acc, it) => acc + (it.values['Saldo Registrado'] || 0),
        0,
      );
    }

    sections.push({
      id: `sec-${title.replace(/\s+/g, '-').toLowerCase()}`,
      title,
      items: dataGroup.items,
      subtotal: {
        id: `sub-${title.replace(/\s+/g, '-').toLowerCase()}`,
        label: `TOTAL ${title}`,
        values: { 'Saldo Registrado': sectionTotal },
        isMajorTotal: true,
      },
    });
  });

  return {
    companyName: sourceName ? `${sourceName}` : 'Empresa / Negocio Local',
    address: 'Plan Contable Consolidado',
    phone: `Datos de ${tableName || 'Tabla'} (${rows.length} registros)`,
    reportTitle: tableName ? tableName.toUpperCase() : 'BALANCE GENERAL Y ESTADOS FINANCIEROS',
    preparedDate: new Date().toLocaleDateString('es-ES'),
    startYear: '2026',
    endYear: '2026',
    periods: ['Saldo Registrado'],
    currencySymbol: '$',
    sections,
  };
}

interface FinancialStatementCardProps {
  readonly initialData?: FinancialStatementData;
  readonly isCompact?: boolean;
  readonly isDarkMode?: boolean;
  readonly onDataChange?: (data: FinancialStatementData) => void;
  readonly rows?: readonly Record<string, unknown>[];
  readonly tableName?: string;
  readonly sourceName?: string;
  readonly externalAuthoringMode?: boolean;
  readonly onToggleAuthoringMode?: () => void;
  readonly defaultReportMode?: 'all' | 'balance' | 'pnl';
}

export function FinancialStatementCard({
  initialData,
  isCompact = false,
  isDarkMode = false,
  onDataChange,
  rows,
  tableName,
  sourceName,
  externalAuthoringMode,
  onToggleAuthoringMode,
  defaultReportMode = 'all',
}: FinancialStatementCardProps) {
  // Initialize from actual rows if provided, or from initialData, or default
  const [data, setData] = useState<FinancialStatementData>(() => {
    if (initialData) return initialData;
    if (rows && rows.length > 0) {
      return buildStatementFromActualRows(rows, tableName, sourceName);
    }
    return defaultPnlStatementData;
  });

  // Re-sync if rows or tableName change
  useEffect(() => {
    if (rows && rows.length > 0 && !initialData) {
      const generated = buildStatementFromActualRows(rows, tableName, sourceName);
      setData(generated);
      onDataChange?.(generated);
    }
  }, [rows, tableName, sourceName, initialData, onDataChange]);

  const [selectedTheme, setSelectedTheme] = useState<FinancialTheme>(
    isDarkMode ? 'corporate_navy' : 'classic_blue',
  );
  const [currencySymbol, setCurrencySymbol] = useState<string>(data.currencySymbol || '$');
  const [internalAuthoringMode, setInternalAuthoringMode] = useState(false);
  const isAuthoringMode =
    externalAuthoringMode !== undefined ? externalAuthoringMode : internalAuthoringMode;
  const toggleAuthoringMode = () => {
    if (onToggleAuthoringMode) {
      onToggleAuthoringMode();
    } else {
      setInternalAuthoringMode((prev) => !prev);
    }
  };

  const [reportMode, setReportMode] = useState<'all' | 'balance' | 'pnl'>(defaultReportMode);
  const [layoutMode, setLayoutMode] = useState<'two_column' | 'single_column'>('two_column');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const visibleSections = useMemo(() => {
    if (reportMode === 'balance') {
      return data.sections.filter((s) => /activo|pasivo|patrimonio/i.test(s.title));
    }
    if (reportMode === 'pnl') {
      return data.sections.filter((s) => /ingreso|costo|gasto|resultado/i.test(s.title));
    }
    return data.sections;
  }, [data.sections, reportMode]);

  const leftSections = useMemo(() => {
    return visibleSections.filter((s) => /activo/i.test(s.title));
  }, [visibleSections]);

  const rightSections = useMemo(() => {
    return visibleSections.filter((s) => /pasivo|patrimonio/i.test(s.title));
  }, [visibleSections]);

  const canUseTwoColumn = leftSections.length > 0 && rightSections.length > 0;

  const totalActivos = useMemo(() => {
    const sec = data.sections.find((s) => /activo/i.test(s.title));
    const p = data.periods[0] || 'Saldo Registrado';
    return sec?.subtotal?.values[p] ?? 0;
  }, [data]);

  const totalPasivos = useMemo(() => {
    const sec = data.sections.find((s) => /pasivo/i.test(s.title) && !/patrimonio/i.test(s.title));
    const p = data.periods[0] || 'Saldo Registrado';
    return sec?.subtotal?.values[p] ?? 0;
  }, [data]);

  const totalPatrimonio = useMemo(() => {
    const sec = data.sections.find((s) => /patrimonio/i.test(s.title));
    const p = data.periods[0] || 'Saldo Registrado';
    return sec?.subtotal?.values[p] ?? 0;
  }, [data]);

  const totalPasivoMasPatrimonio = totalPasivos + totalPatrimonio;
  const isBalanceCuadrado = Math.abs(totalActivos - totalPasivoMasPatrimonio) < 1;

  // Section / Row addition modal state
  const [newRowDraft, setNewRowDraft] = useState<{
    sectionId: string;
    label: string;
    amount: string;
    indentLevel: number;
    isSubtotal: boolean;
  } | null>(null);

  const toggleSection = (secId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  };

  const handleMetadataChange = (field: keyof FinancialStatementData, value: string) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      onDataChange?.(next);
      return next;
    });
  };

  const formatFinancialNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    if (num === 0) return '-';
    const isNeg = num < 0;
    const absVal = Math.abs(num);
    const formatted = absVal.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNeg ? `(${formatted})` : formatted;
  };

  // ==========================================
  // AUTHORING: Add Section, Add Row, Delete Row
  // ==========================================
  const handleAddNewSection = () => {
    const title = window.prompt('Nombre de la nueva sección (ej: GASTOS DE OPERACIÓN):');
    if (!title || !title.trim()) return;

    setData((prev) => {
      const newSec: FinancialSection = {
        id: `sec-${Date.now()}`,
        title: title.trim().toUpperCase(),
        items: [
          {
            id: `item-${Date.now()}-1`,
            label: 'Nueva fila de cuenta / concepto',
            values: prev.periods.reduce((acc, p) => ({ ...acc, [p]: 0 }), {}),
            indentLevel: 1,
          },
        ],
        subtotal: {
          id: `sub-${Date.now()}`,
          label: `TOTAL ${title.trim().toUpperCase()}`,
          values: prev.periods.reduce((acc, p) => ({ ...acc, [p]: 0 }), {}),
          isMajorTotal: true,
        },
      };

      const next = { ...prev, sections: [...prev.sections, newSec] };
      onDataChange?.(next);
      return next;
    });
  };

  const handleDeleteSection = (secId: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        sections: prev.sections.filter((s) => s.id !== secId),
      };
      onDataChange?.(next);
      return next;
    });
  };

  const handleOpenAddRowModal = (sectionId: string) => {
    setNewRowDraft({
      sectionId,
      label: '',
      amount: '',
      indentLevel: 1,
      isSubtotal: false,
    });
  };

  const handleConfirmAddRow = () => {
    if (!newRowDraft || !newRowDraft.label.trim()) return;

    setData((prev) => {
      const numAmount = Number(newRowDraft.amount) || 0;
      const newItem: FinancialLineItem = {
        id: `row-${Date.now()}`,
        label: newRowDraft.label.trim(),
        values: prev.periods.reduce((acc, p) => ({ ...acc, [p]: numAmount }), {}),
        indentLevel: newRowDraft.indentLevel,
        isSubtotal: newRowDraft.isSubtotal,
      };

      const nextSections = prev.sections.map((sec) => {
        if (sec.id === newRowDraft.sectionId) {
          const currentItems = sec.items || [];
          const updatedItems = [...currentItems, newItem];
          // Recalculate subtotal
          const updatedSubtotal = sec.subtotal
            ? {
                ...sec.subtotal,
                values: prev.periods.reduce((acc, p) => {
                  const sum = updatedItems.reduce((s, it) => s + (it.values[p] || 0), 0);
                  return { ...acc, [p]: sum };
                }, {}),
              }
            : undefined;

          return { ...sec, items: updatedItems, subtotal: updatedSubtotal };
        }
        return sec;
      });

      const next = { ...prev, sections: nextSections };
      onDataChange?.(next);
      return next;
    });

    setNewRowDraft(null);
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    setData((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          const nextItems = (sec.items || []).filter((it) => it.id !== itemId);
          // Recalculate subtotal
          const updatedSubtotal = sec.subtotal
            ? {
                ...sec.subtotal,
                values: prev.periods.reduce((acc, p) => {
                  const sum = nextItems.reduce((s, it) => s + (it.values[p] || 0), 0);
                  return { ...acc, [p]: sum };
                }, {}),
              }
            : undefined;
          return { ...sec, items: nextItems, subtotal: updatedSubtotal };
        }
        return sec;
      });

      const next = { ...prev, sections: nextSections };
      onDataChange?.(next);
      return next;
    });
  };

  const handleCellValChange = (
    sectionId: string,
    itemId: string,
    period: string,
    newVal: number,
  ) => {
    setData((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          const updatedItems = (sec.items || []).map((it) => {
            if (it.id === itemId) {
              return { ...it, values: { ...it.values, [period]: newVal } };
            }
            return it;
          });

          const updatedSubtotal = sec.subtotal
            ? {
                ...sec.subtotal,
                values: prev.periods.reduce((acc, p) => {
                  const sum = updatedItems.reduce((s, it) => s + (it.values[p] || 0), 0);
                  return { ...acc, [p]: sum };
                }, {}),
              }
            : undefined;

          return { ...sec, items: updatedItems, subtotal: updatedSubtotal };
        }
        return sec;
      });

      const next = { ...prev, sections: nextSections };
      onDataChange?.(next);
      return next;
    });
  };

  const handleItemLabelChange = (
    sectionId: string,
    itemId: string,
    newLabel: string,
  ) => {
    setData((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          const updatedItems = (sec.items || []).map((it) => {
            if (it.id === itemId) {
              return { ...it, label: newLabel };
            }
            return it;
          });
          return { ...sec, items: updatedItems };
        }
        return sec;
      });
      const next = { ...prev, sections: nextSections };
      onDataChange?.(next);
      return next;
    });
  };

  const handleInsertRowAfter = (sectionId: string, afterItemId: string) => {
    setData((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          const currentItems = sec.items || [];
          const idx = currentItems.findIndex((it) => it.id === afterItemId);
          const afterItem = currentItems[idx];
          const newItem: FinancialLineItem = {
            id: `row-${Date.now()}`,
            label: 'Nueva fila personalizada',
            values: prev.periods.reduce((acc, p) => ({ ...acc, [p]: 0 }), {}),
            indentLevel: afterItem?.indentLevel ?? 1,
            isSubtotal: false,
          };
          const updatedItems = [...currentItems];
          if (idx !== -1) {
            updatedItems.splice(idx + 1, 0, newItem);
          } else {
            updatedItems.push(newItem);
          }
          return { ...sec, items: updatedItems };
        }
        return sec;
      });
      const next = { ...prev, sections: nextSections };
      onDataChange?.(next);
      return next;
    });
  };

  const handleCycleIndent = (sectionId: string, itemId: string) => {
    setData((prev) => {
      const nextSections = prev.sections.map((sec) => {
        if (sec.id === sectionId) {
          const updatedItems = (sec.items || []).map((it) => {
            if (it.id === itemId) {
              const nextIndent = ((it.indentLevel ?? 0) + 1) % 3;
              return { ...it, indentLevel: nextIndent };
            }
            return it;
          });
          return { ...sec, items: updatedItems };
        }
        return sec;
      });
      const next = { ...prev, sections: nextSections };
      onDataChange?.(next);
      return next;
    });
  };

  const handleAddPeriod = () => {
    const newPeriod = window.prompt('Nombre del nuevo período o año (ej: 2027, Octubre 2026):');
    if (!newPeriod || !newPeriod.trim()) return;

    setData((prev) => {
      const p = newPeriod.trim();
      if (prev.periods.includes(p)) return prev;

      const nextPeriods = [...prev.periods, p];
      const next = { ...prev, periods: nextPeriods };
      onDataChange?.(next);
      return next;
    });
  };

  const handleResetToRealData = () => {
    if (rows && rows.length > 0) {
      const generated = buildStatementFromActualRows(rows, tableName, sourceName);
      setData(generated);
      onDataChange?.(generated);
    } else {
      setData(defaultPnlStatementData);
      onDataChange?.(defaultPnlStatementData);
    }
  };


  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Concepto', ...data.periods];
    const rowsList: string[] = [headers.join(',')];

    data.sections.forEach((sec) => {
      rowsList.push(`"${sec.title}",${data.periods.map(() => '').join(',')}`);
      sec.items?.forEach((item) => {
        const vals = data.periods.map((p) => item.values[p] ?? 0);
        rowsList.push(`"${item.label}",${vals.join(',')}`);
      });
      if (sec.subtotal) {
        const vals = data.periods.map((p) => sec.subtotal?.values[p] ?? 0);
        rowsList.push(`"${sec.subtotal.label}",${vals.join(',')}`);
      }
    });

    const blob = new Blob([rowsList.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.reportTitle.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color theme classes mapping
  const themeClasses = useMemo(() => {
    switch (selectedTheme) {
      case 'classic_blue':
        return {
          titleColor: 'text-[#2b6cb0] dark:text-[#63b3ed]',
          sectionBg: 'bg-[#cbd5e1] dark:bg-slate-700/80 text-slate-900 dark:text-slate-100',
          subtotalBg: 'bg-slate-100/60 dark:bg-slate-800/50',
          majorTotalBg: 'bg-[#e2e8f0]/70 dark:bg-slate-800 text-foreground font-extrabold',
          netIncomeBg: 'bg-[#dbeafe] dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-b-4 border-double border-blue-600',
          tableBorder: 'border-slate-300 dark:border-slate-700',
        };
      case 'corporate_navy':
        return {
          titleColor: 'text-indigo-800 dark:text-indigo-300',
          sectionBg: 'bg-indigo-100/90 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-100',
          subtotalBg: 'bg-indigo-50/50 dark:bg-slate-800/40',
          majorTotalBg: 'bg-indigo-100/50 dark:bg-indigo-900/40 text-foreground font-extrabold',
          netIncomeBg: 'bg-indigo-200/60 dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-100 border-b-4 border-double border-indigo-700',
          tableBorder: 'border-indigo-200 dark:border-indigo-900',
        };
      case 'emerald_finance':
        return {
          titleColor: 'text-emerald-700 dark:text-emerald-400',
          sectionBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100',
          subtotalBg: 'bg-emerald-50/40 dark:bg-slate-800/40',
          majorTotalBg: 'bg-emerald-100/60 dark:bg-emerald-900/40 text-foreground font-extrabold',
          netIncomeBg: 'bg-emerald-200/60 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100 border-b-4 border-double border-emerald-600',
          tableBorder: 'border-emerald-200 dark:border-emerald-900',
        };
      case 'minimal_slate':
      default:
        return {
          titleColor: 'text-foreground',
          sectionBg: 'bg-surface-subtle text-foreground border-y border-surface-border',
          subtotalBg: 'bg-surface-subtle/30',
          majorTotalBg: 'bg-surface-subtle text-foreground font-extrabold',
          netIncomeBg: 'bg-surface-subtle text-foreground border-b-4 border-double border-foreground',
          tableBorder: 'border-surface-border',
        };
    }
  }, [selectedTheme]);

  const renderSection = (section: FinancialSection) => {
    const isCollapsed = Boolean(collapsedSections[section.id]);

    return (
      <div
        key={section.id}
        className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs"
      >
        {/* Section Header Shaded Banner */}
        <div
          className={`py-2 px-3 flex items-center justify-between cursor-pointer select-none transition-colors ${themeClasses.sectionBg}`}
          onClick={() => toggleSection(section.id)}
        >
          <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wide text-xs">
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            )}
            <span>{section.title}</span>
          </div>

          <div className="flex items-center gap-2">
            {isAuthoringMode && (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => handleOpenAddRowModal(section.id)}
                  className="p-1 rounded hover:bg-black/10 text-primary font-bold"
                  title="Añadir fila a esta sección"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSection(section.id)}
                  className="p-1 rounded hover:bg-danger/20 text-danger"
                  title="Eliminar sección"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div className="overflow-x-auto bg-white dark:bg-slate-900/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-muted uppercase font-bold bg-slate-50/50 dark:bg-slate-900/20">
                  <th className="py-2 px-3 min-w-[160px]">Cuenta / Concepto</th>
                  {data.periods.map((period) => (
                    <th key={period} className="py-2 px-3 text-right font-mono min-w-[76px]">
                      {period}
                    </th>
                  ))}
                  {isAuthoringMode && (
                    <th className="py-2 px-2 text-right w-16">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Direct Items */}
                {section.items?.map((item) => {
                  const parsed = parseAccountLabel(item.label);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 dark:border-slate-800/60 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        item.isMajorTotal
                          ? themeClasses.majorTotalBg
                          : item.isSubtotal
                          ? `${themeClasses.subtotalBg} font-bold`
                          : 'text-foreground'
                      }`}
                    >
                      <td
                        className={`py-1.5 px-3 ${
                          item.indentLevel === 1
                            ? 'pl-6'
                            : item.indentLevel === 2
                            ? 'pl-10 text-muted'
                            : 'font-medium'
                        } ${item.isSubtotal || item.isMajorTotal ? 'font-bold' : ''}`}
                      >
                        {isAuthoringMode ? (
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) =>
                              handleItemLabelChange(section.id, item.id, e.target.value)
                            }
                            className="w-full px-1.5 py-0.5 rounded border border-surface-border bg-surface text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0">
                            {parsed.code && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                {parsed.code}
                              </span>
                            )}
                            <span
                              className={`truncate ${
                                item.isSubtotal ? 'font-bold text-foreground' : ''
                              }`}
                            >
                              {parsed.name}
                            </span>
                            {item.note && (
                              <span className="text-[10px] text-muted italic ml-1 shrink-0">
                                {item.note}
                              </span>
                            )}
                            {/* Dotted leader line between text and amount */}
                            <div className="flex-1 mx-2 border-b border-dotted border-slate-300 dark:border-slate-700 min-w-[12px] self-end mb-1 opacity-70" />
                          </div>
                        )}
                      </td>

                      {data.periods.map((period) => (
                        <td
                          key={period}
                          className={`py-1.5 px-3 text-right font-mono shrink-0 whitespace-nowrap min-w-[76px] ${
                            item.isSubtotal || item.isMajorTotal
                              ? 'font-bold'
                              : 'font-normal'
                          }`}
                        >
                          {isAuthoringMode ? (
                            <input
                              type="number"
                              value={item.values[period] ?? 0}
                              onChange={(e) =>
                                handleCellValChange(
                                  section.id,
                                  item.id,
                                  period,
                                  Number(e.target.value),
                                )
                              }
                              className="w-24 px-1.5 py-0.5 rounded border border-surface-border bg-surface text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <>
                              <span className="text-muted/60 text-[10px] mr-1">
                                {currencySymbol}
                              </span>
                              <span>{formatFinancialNumber(item.values[period])}</span>
                            </>
                          )}
                        </td>
                      ))}

                      {isAuthoringMode && (
                        <td className="py-1 px-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleCycleIndent(section.id, item.id)}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-surface border border-surface-border text-muted hover:text-foreground"
                              title="Cambiar sangría (N0: Grupo, N1: Cuenta, N2: Subcuenta)"
                            >
                              N{item.indentLevel ?? 0}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertRowAfter(section.id, item.id)}
                              className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                              title="Insertar fila debajo de esta"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(section.id, item.id)}
                              className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Eliminar fila"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* Subsections if any */}
                {section.subSections?.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-200 dark:border-slate-800">
                    <td
                      colSpan={data.periods.length + (isAuthoringMode ? 2 : 1)}
                      className="p-0"
                    >
                      <div className="bg-slate-50/80 dark:bg-slate-900/60 font-bold py-1.5 px-3 text-[11px] uppercase tracking-wider text-muted pl-5 border-b border-slate-200 dark:border-slate-800">
                        {sub.title}
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <tbody>
                          {sub.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                            >
                              <td className="py-1.5 px-3 pl-8 text-foreground">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="truncate">{item.label}</span>
                                  <div className="flex-1 mx-2 border-b border-dotted border-slate-300 dark:border-slate-700 min-w-[12px] self-end mb-1 opacity-70" />
                                </div>
                              </td>
                              {data.periods.map((period) => (
                                <td
                                  key={period}
                                  className="py-1.5 px-3 text-right font-mono text-muted hover:text-foreground shrink-0 whitespace-nowrap min-w-[76px]"
                                >
                                  <span className="text-muted/60 text-[10px] mr-1">
                                    {currencySymbol}
                                  </span>
                                  <span>{formatFinancialNumber(item.values[period])}</span>
                                </td>
                              ))}
                              {isAuthoringMode && <td />}
                            </tr>
                          ))}
                          {sub.subtotal && (
                            <tr
                              className={`border-t border-b border-slate-300 dark:border-slate-700 font-bold ${themeClasses.subtotalBg}`}
                            >
                              <td className="py-2 px-3 pl-5 uppercase font-bold text-foreground">
                                {sub.subtotal.label}
                              </td>
                              {data.periods.map((period) => (
                                <td
                                  key={period}
                                  className="py-2 px-3 text-right font-mono font-bold text-foreground shrink-0 whitespace-nowrap"
                                >
                                  <span className="text-muted/60 text-[10px] mr-1">
                                    {currencySymbol}
                                  </span>
                                  <span>
                                    {formatFinancialNumber(sub.subtotal?.values[period])}
                                  </span>
                                </td>
                              ))}
                              {isAuthoringMode && <td />}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                ))}

                {/* Section Subtotal Row */}
                {section.subtotal && (
                  <tr
                    className={`border-t-2 border-b border-slate-300 dark:border-slate-700 font-black ${
                      section.subtotal.isNetIncome
                        ? themeClasses.netIncomeBg
                        : section.subtotal.isMajorTotal
                        ? themeClasses.majorTotalBg
                        : themeClasses.subtotalBg
                    }`}
                  >
                    <td className="py-2 px-3 uppercase tracking-wide">
                      {section.subtotal.label}
                    </td>
                    {data.periods.map((period) => (
                      <td
                        key={period}
                        className="py-2 px-3 text-right font-mono text-xs font-black shrink-0 whitespace-nowrap min-w-[76px]"
                      >
                        <span className="text-muted/60 text-[11px] mr-1">
                          {currencySymbol}
                        </span>
                        <span>
                          {formatFinancialNumber(section.subtotal?.values[period])}
                        </span>
                      </td>
                    ))}
                    {isAuthoringMode && <td />}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-4 font-sans select-text">
      {/* Interactive Controls Bar - Sticky at Top */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 border border-surface-border rounded-2xl shadow-sm space-y-2.5 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher: Balance General vs P&L vs Consolidado */}
            <div className="flex items-center p-0.5 rounded-lg border border-surface-border bg-surface-subtle text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setReportMode('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  reportMode === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Consolidado
              </button>
              <button
                type="button"
                onClick={() => setReportMode('balance')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  reportMode === 'balance'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Balance General
              </button>
              <button
                type="button"
                onClick={() => setReportMode('pnl')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  reportMode === 'pnl'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Estado de Resultados
              </button>
            </div>

            {/* Layout Switcher: 2 Columnas (T-Account) vs 1 Columna (Reporte) */}
            {canUseTwoColumn && (
              <div className="flex items-center p-0.5 rounded-lg border border-surface-border bg-surface-subtle text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLayoutMode('two_column')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    layoutMode === 'two_column'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Formato en Cuenta: 2 Columnas lado a lado (Activo vs Pasivo/Patrimonio - Estándar CFO)"
                >
                  <Columns className="h-3 w-3" />
                  <span>2 Columnas (T-Account)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('single_column')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                    layoutMode === 'single_column'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Formato de Reporte: 1 Columna vertical con guías contables"
                >
                  <List className="h-3 w-3" />
                  <span>1 Columna</span>
                </button>
              </div>
            )}

            <span className="text-[11px] font-bold uppercase tracking-wider text-muted ml-2">
              Paleta:
            </span>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as FinancialTheme)}
              className="px-2.5 py-1 rounded-lg border border-surface-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            >
              <option value="classic_blue">Clásico Contable (Azul Pizarra)</option>
              <option value="corporate_navy">Corporativo Marino</option>
              <option value="emerald_finance">Finanzas Esmeralda</option>
              <option value="minimal_slate">Minimalista Neutro</option>
            </select>

            <span className="text-[11px] font-bold uppercase tracking-wider text-muted ml-1">
              Moneda:
            </span>
            <select
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className="px-2 py-1 rounded-lg border border-surface-border bg-surface text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            >
              <option value="$">$ (Dólar / Pesos)</option>
              <option value="€">€ (Euro)</option>
              <option value="S/">S/ (Soles)</option>
              <option value="Bs.">Bs. (Bolívares)</option>
              <option value="">Sin símbolo</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Authoring Mode Toggle Button */}
            <button
              onClick={toggleAuthoringMode}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold transition-all shadow-xs ${
                isAuthoringMode
                  ? 'border-primary bg-primary text-white shadow-primary/20'
                  : 'border-surface-border bg-surface text-foreground hover:bg-surface-subtle'
              }`}
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>{isAuthoringMode ? 'Listo / Guardar' : 'Modo Constructor / Editar Filas'}</span>
            </button>

            {isAuthoringMode && (
              <>
                <button
                  onClick={handleAddNewSection}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-surface-border text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>+ Sección</span>
                </button>

                <button
                  onClick={handleAddPeriod}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-surface-border text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5 text-accent" />
                  <span>+ Período</span>
                </button>

                {rows && rows.length > 0 && (
                  <button
                    onClick={handleResetToRealData}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-surface-border bg-surface text-xs text-muted hover:text-foreground transition-all"
                    title="Recalcular desde las filas de la tabla seleccionada"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Restablecer</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-xs"
              title="Exportar reporte a archivo CSV"
            >
              <Download className="h-3.5 w-3.5 text-muted" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-xs"
              title="Imprimir o exportar en PDF"
            >
              <Printer className="h-3.5 w-3.5 text-primary" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Accounting Equation Check Banner for Balance General */}
        {(reportMode === 'balance' || reportMode === 'all') && totalActivos > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl border border-surface-border bg-surface-subtle/70 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold uppercase tracking-wider text-muted text-[10px]">
                Ecuación Contable:
              </span>
              <span className="font-mono font-bold text-foreground">
                Activos (${formatFinancialNumber(totalActivos)}) = Pasivos ($
                {formatFinancialNumber(totalPasivos)}) + Patrimonio ($
                {formatFinancialNumber(totalPatrimonio)})
              </span>
            </div>
            <div>
              {isBalanceCuadrado ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>✓ Balance General Cuadrado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>
                    Diferencia: $
                    {formatFinancialNumber(
                      Math.abs(totalActivos - totalPasivoMasPatrimonio),
                    )}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Financial Statement Sheet Container */}
      <div
        className={`bg-white dark:bg-slate-950 ${
          isCompact ? 'p-3.5 space-y-4' : 'p-6 md:p-8 space-y-6'
        } rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-x-auto`}
      >
        {/* Executive Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Left: Report Title & Company Details */}
            <div className="space-y-1.5 flex-1 min-w-[240px]">
              {isAuthoringMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={data.reportTitle}
                    onChange={(e) => handleMetadataChange('reportTitle', e.target.value)}
                    placeholder="Título del reporte..."
                    className="w-full px-2 py-1 rounded border border-surface-border bg-surface text-base font-extrabold focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={data.companyName}
                    onChange={(e) => handleMetadataChange('companyName', e.target.value)}
                    placeholder="Nombre de la empresa..."
                    className="w-full px-2 py-1 rounded border border-surface-border bg-surface text-sm font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => handleMetadataChange('address', e.target.value)}
                    placeholder="Dirección o descripción..."
                    className="w-full px-2 py-1 rounded border border-surface-border bg-surface text-xs text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => handleMetadataChange('phone', e.target.value)}
                    placeholder="Teléfono o metadata..."
                    className="w-full px-2 py-1 rounded border border-surface-border bg-surface text-xs text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <h1 className={`text-base sm:text-lg md:text-2xl font-black tracking-tight uppercase leading-snug ${themeClasses.titleColor}`}>
                    {data.reportTitle}
                  </h1>
                  <h2 className="text-base md:text-lg font-bold text-foreground mt-1">
                    {data.companyName}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">{data.address}</p>
                  <p className="text-xs text-muted">{data.phone}</p>
                </div>
              )}
            </div>

            {/* Right: Accounting Metadata Box */}
            <div className="shrink-0 flex flex-col items-end">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                ESTRUCTURA CONTABLE
              </h3>
              <table className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
                <tbody>
                  <tr className="border-b border-slate-300 dark:border-slate-700">
                    <td className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 font-bold text-muted text-[10px] uppercase">
                      FECHA DE CORTE
                    </td>
                    <td className="px-3 py-1 font-mono text-right font-medium">
                      {isAuthoringMode ? (
                        <input
                          type="text"
                          value={data.preparedDate}
                          onChange={(e) => handleMetadataChange('preparedDate', e.target.value)}
                          className="w-24 text-right px-1 bg-surface border rounded"
                        />
                      ) : (
                        data.preparedDate
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300 dark:border-slate-700">
                    <td className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 font-bold text-muted text-[10px] uppercase">
                      INICIO
                    </td>
                    <td className="px-3 py-1 font-mono text-right font-medium">
                      {isAuthoringMode ? (
                        <input
                          type="text"
                          value={data.startYear}
                          onChange={(e) => handleMetadataChange('startYear', e.target.value)}
                          className="w-24 text-right px-1 bg-surface border rounded"
                        />
                      ) : (
                        data.startYear
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 font-bold text-muted text-[10px] uppercase">
                      CIERRE
                    </td>
                    <td className="px-3 py-1 font-mono text-right font-medium">
                      {isAuthoringMode ? (
                        <input
                          type="text"
                          value={data.endYear}
                          onChange={(e) => handleMetadataChange('endYear', e.target.value)}
                          className="w-24 text-right px-1 bg-surface border rounded"
                        />
                      ) : (
                        data.endYear
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Main Accounting Table / Statement Structure */}
        {canUseTwoColumn && layoutMode === 'two_column' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch pt-2">
            {/* Left Column: ACTIVOS */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs overflow-hidden">
              <div className="p-3.5 md:p-5 space-y-4">
                {leftSections.map((sec) => renderSection(sec))}
              </div>
              <div className="mt-auto p-4 bg-slate-100/90 dark:bg-slate-800/90 border-t-2 border-double border-slate-400 dark:border-slate-600 flex items-center justify-between">
                <span className="font-black text-xs md:text-sm uppercase tracking-wide text-foreground">
                  TOTAL ACTIVOS
                </span>
                <span className="font-mono text-sm md:text-base font-black text-foreground">
                  {currencySymbol} {formatFinancialNumber(totalActivos)}
                </span>
              </div>
            </div>

            {/* Right Column: PASIVOS & PATRIMONIO */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs overflow-hidden">
              <div className="p-3.5 md:p-5 space-y-4">
                {rightSections.map((sec) => renderSection(sec))}
              </div>
              <div className="mt-auto p-4 bg-slate-100/90 dark:bg-slate-800/90 border-t-2 border-double border-slate-400 dark:border-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs md:text-sm uppercase tracking-wide text-foreground">
                    TOTAL PASIVO + PATRIMONIO
                  </span>
                  {isBalanceCuadrado && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ✓ Cuadrado
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm md:text-base font-black text-foreground">
                  {currencySymbol} {formatFinancialNumber(totalPasivoMasPatrimonio)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {visibleSections.map((sec) => renderSection(sec))}
          </div>
        )}

        {/* Modal for adding a custom row */}
        {newRowDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-surface border border-surface-border p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">+ Añadir Fila Personalizada</h3>
                <button
                  onClick={() => setNewRowDraft(null)}
                  className="p-1 rounded text-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-muted font-bold mb-1">Concepto / Nombre:</label>
                  <input
                    type="text"
                    value={newRowDraft.label}
                    onChange={(e) =>
                      setNewRowDraft({ ...newRowDraft, label: e.target.value })
                    }
                    placeholder="Ej: Ventas por Canal Digital"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-subtle text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-muted font-bold mb-1">Monto Inicial:</label>
                  <input
                    type="number"
                    value={newRowDraft.amount}
                    onChange={(e) =>
                      setNewRowDraft({ ...newRowDraft, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-subtle text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-muted font-bold mb-1">Nivel de Sangría:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 0, label: 'Principal (0)' },
                      { val: 1, label: 'Subcuenta (1)' },
                      { val: 2, label: 'Detalle (2)' },
                    ].map((lvl) => (
                      <button
                        key={lvl.val}
                        type="button"
                        onClick={() =>
                          setNewRowDraft({ ...newRowDraft, indentLevel: lvl.val })
                        }
                        className={`py-1 rounded-lg border text-xs font-semibold ${
                          newRowDraft.indentLevel === lvl.val
                            ? 'bg-primary text-white border-primary'
                            : 'border-surface-border bg-surface hover:bg-surface-subtle'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-border">
                <button
                  onClick={() => setNewRowDraft(null)}
                  className="px-3 py-1.5 text-xs text-muted hover:text-foreground font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAddRow}
                  disabled={!newRowDraft.label.trim()}
                  className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary-hover disabled:opacity-50 shadow-sm"
                >
                  Insertar Fila
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
