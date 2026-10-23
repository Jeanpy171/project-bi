'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  Printer,
} from 'lucide-react';

export type FinancialTheme = 'classic_blue' | 'corporate_navy' | 'emerald_finance' | 'minimal_slate';

export interface FinancialLineItem {
  readonly id: string;
  readonly label: string;
  readonly values: Record<string, number | null>;
  readonly isSubtotal?: boolean;
  readonly isMajorTotal?: boolean;
  readonly isNetIncome?: boolean;
  readonly indentLevel?: number; // 0, 1, 2
  readonly note?: string;
}

export interface FinancialSubSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly FinancialLineItem[];
  readonly subtotal?: FinancialLineItem;
}

export interface FinancialSection {
  readonly id: string;
  readonly title: string;
  readonly subSections?: readonly FinancialSubSection[];
  readonly items?: readonly FinancialLineItem[];
  readonly subtotal?: FinancialLineItem;
}

export interface FinancialStatementData {
  companyName: string;
  address: string;
  phone: string;
  reportTitle: string;
  preparedDate: string;
  startYear: string;
  endYear: string;
  periods: readonly string[];
  currencySymbol: string;
  sections: readonly FinancialSection[];
  bottomLines?: readonly FinancialLineItem[];
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

interface FinancialStatementCardProps {
  readonly initialData?: FinancialStatementData;
  readonly isCompact?: boolean;
  readonly isDarkMode?: boolean;
  readonly onDataChange?: (data: FinancialStatementData) => void;
}

export function FinancialStatementCard({
  initialData = defaultPnlStatementData,
  isCompact = false,
  isDarkMode = false,
  onDataChange,
}: FinancialStatementCardProps) {
  const [data, setData] = useState<FinancialStatementData>(initialData);
  const [selectedTheme, setSelectedTheme] = useState<FinancialTheme>(
    isDarkMode ? 'corporate_navy' : 'classic_blue',
  );
  const [currencySymbol, setCurrencySymbol] = useState<string>(initialData.currencySymbol || '$');
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

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

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Concepto', ...data.periods];
    const rows: string[] = [headers.join(',')];

    data.sections.forEach((sec) => {
      rows.push(`"${sec.title}",${data.periods.map(() => '').join(',')}`);
      sec.items?.forEach((item) => {
        const vals = data.periods.map((p) => item.values[p] ?? 0);
        rows.push(`"${item.label}",${vals.join(',')}`);
      });
      sec.subSections?.forEach((sub) => {
        rows.push(`"  ${sub.title}",${data.periods.map(() => '').join(',')}`);
        sub.items.forEach((item) => {
          const vals = data.periods.map((p) => item.values[p] ?? 0);
          rows.push(`"    ${item.label}",${vals.join(',')}`);
        });
        if (sub.subtotal) {
          const vals = data.periods.map((p) => sub.subtotal?.values[p] ?? 0);
          rows.push(`"  ${sub.subtotal.label}",${vals.join(',')}`);
        }
      });
      if (sec.subtotal) {
        const vals = data.periods.map((p) => sec.subtotal?.values[p] ?? 0);
        rows.push(`"${sec.subtotal.label}",${vals.join(',')}`);
      }
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
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

  return (
    <div className="w-full flex flex-col space-y-4 font-sans select-text">
      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-border no-print">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
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

          <span className="text-[11px] font-bold uppercase tracking-wider text-muted ml-2">
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditingMetadata((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${
              isEditingMetadata
                ? 'border-primary bg-primary text-white shadow-xs'
                : 'border-surface-border bg-surface text-foreground hover:bg-surface-subtle'
            }`}
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>{isEditingMetadata ? 'Listo' : 'Personalizar Encabezado'}</span>
          </button>

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

      {/* Financial Statement Sheet Container (Pixel-Perfect from Image 2) */}
      <div className={`bg-white dark:bg-slate-950 ${isCompact ? 'p-3.5 space-y-4' : 'p-6 md:p-8 space-y-6'} rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-x-auto`}>
        {/* Executive Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            {/* Left: Report Title & Company Details */}
            <div className="space-y-1.5 flex-1 min-w-0">
              {isEditingMetadata ? (
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
                    placeholder="Dirección..."
                    className="w-full px-2 py-1 rounded border border-surface-border bg-surface text-xs text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => handleMetadataChange('phone', e.target.value)}
                    placeholder="Teléfono..."
                    className="w-full px-2 py-1 rounded border border-surface-border bg-surface text-xs text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <h1 className={`text-xl md:text-2xl font-black tracking-tight uppercase ${themeClasses.titleColor}`}>
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
                GANANCIAS Y PÉRDIDAS ANUALES
              </h3>
              <table className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden">
                <tbody>
                  <tr className="border-b border-slate-300 dark:border-slate-700">
                    <td className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 font-bold text-muted text-[10px] uppercase">
                      FECHA DE PREPARACIÓN
                    </td>
                    <td className="px-3 py-1 font-mono text-right font-medium">
                      {isEditingMetadata ? (
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
                      AÑO DE INICIO
                    </td>
                    <td className="px-3 py-1 font-mono text-right font-medium">
                      {isEditingMetadata ? (
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
                      AÑO DE FINALIZACIÓN
                    </td>
                    <td className="px-3 py-1 font-mono text-right font-medium">
                      {isEditingMetadata ? (
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

        {/* Main Accounting Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-400 dark:border-slate-600">
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-muted w-1/3">
                  Concepto
                </th>
                {data.periods.map((period) => (
                  <th
                    key={period}
                    className="py-2.5 px-3 font-bold text-right tracking-wider text-foreground font-mono"
                  >
                    {period}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.sections.map((section) => {
                const isCollapsed = Boolean(collapsedSections[section.id]);

                return (
                  <tbody key={section.id} className="border-b border-slate-200 dark:border-slate-800">
                    {/* Section Shaded Banner (Image 2 style) */}
                    <tr
                      onClick={() => toggleSection(section.id)}
                      className={`cursor-pointer transition-colors ${themeClasses.sectionBg}`}
                    >
                      <td className="py-2 px-3 font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 text-muted" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-muted" />
                        )}
                        <span>{section.title}</span>
                      </td>
                      {data.periods.map((period) => (
                        <td key={period} className="py-2 px-3 text-right font-mono font-bold">
                          {period}
                        </td>
                      ))}
                    </tr>

                    {!isCollapsed && (
                      <>
                        {/* Section Direct Line Items */}
                        {section.items?.map((item) => (
                          <tr
                            key={item.id}
                            className={`border-b border-slate-100 dark:border-slate-900 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                              item.isMajorTotal
                                ? themeClasses.majorTotalBg
                                : item.isSubtotal
                                ? `${themeClasses.subtotalBg} font-bold`
                                : 'text-foreground'
                            }`}
                          >
                            <td
                              className={`py-2 px-3 ${
                                item.indentLevel === 1
                                  ? 'pl-7 text-muted'
                                  : item.indentLevel === 2
                                  ? 'pl-11 text-muted'
                                  : 'font-medium'
                              } ${item.isSubtotal || item.isMajorTotal ? 'font-bold' : ''}`}
                            >
                              <span>{item.label}</span>
                              {item.note && (
                                <span className="text-[10px] text-muted italic ml-1.5">
                                  {item.note}
                                </span>
                              )}
                            </td>
                            {data.periods.map((period) => (
                              <td
                                key={period}
                                className={`py-2 px-3 text-right font-mono ${
                                  item.isSubtotal || item.isMajorTotal
                                    ? 'font-bold'
                                    : 'font-normal'
                                }`}
                              >
                                <span className="text-muted/60 text-[10px] mr-1.5">
                                  {currencySymbol}
                                </span>
                                <span>{formatFinancialNumber(item.values[period])}</span>
                              </td>
                            ))}
                          </tr>
                        ))}

                        {/* Subsections (e.g. VENTA, GENERAL Y ADMINISTRACIÓN) */}
                        {section.subSections?.map((sub) => (
                          <tbody key={sub.id}>
                            <tr className="bg-slate-50/80 dark:bg-slate-900/60 font-bold border-b border-slate-200 dark:border-slate-800">
                              <td
                                colSpan={data.periods.length + 1}
                                className="py-1.5 px-3 text-[11px] font-black uppercase tracking-wider text-muted pl-5"
                              >
                                {sub.title}
                              </td>
                            </tr>

                            {sub.items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                              >
                                <td className="py-1.5 px-3 pl-8 text-foreground">
                                  <span>{item.label}</span>
                                  {item.note && (
                                    <span className="text-[10px] text-muted italic ml-1">
                                      {item.note}
                                    </span>
                                  )}
                                </td>
                                {data.periods.map((period) => (
                                  <td
                                    key={period}
                                    className="py-1.5 px-3 text-right font-mono text-muted hover:text-foreground"
                                  >
                                    <span className="text-muted/60 text-[10px] mr-1.5">
                                      {currencySymbol}
                                    </span>
                                    <span>{formatFinancialNumber(item.values[period])}</span>
                                  </td>
                                ))}
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
                                    className="py-2 px-3 text-right font-mono font-bold text-foreground"
                                  >
                                    <span className="text-muted/60 text-[10px] mr-1.5">
                                      {currencySymbol}
                                    </span>
                                    <span>{formatFinancialNumber(sub.subtotal?.values[period])}</span>
                                  </td>
                                ))}
                              </tr>
                            )}
                          </tbody>
                        ))}

                        {/* Section Subtotal / Major Result Row */}
                        {section.subtotal && (
                          <tr
                            className={`border-t-2 border-b-2 border-slate-400 dark:border-slate-600 font-black ${
                              section.subtotal.isNetIncome
                                ? themeClasses.netIncomeBg
                                : section.subtotal.isMajorTotal
                                ? themeClasses.majorTotalBg
                                : themeClasses.subtotalBg
                            }`}
                          >
                            <td className="py-2.5 px-3 uppercase tracking-wide">
                              {section.subtotal.label}
                            </td>
                            {data.periods.map((period) => (
                              <td
                                key={period}
                                className="py-2.5 px-3 text-right font-mono text-sm font-black"
                              >
                                <span className="text-muted/60 text-[11px] mr-1.5">
                                  {currencySymbol}
                                </span>
                                <span>{formatFinancialNumber(section.subtotal?.values[period])}</span>
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
