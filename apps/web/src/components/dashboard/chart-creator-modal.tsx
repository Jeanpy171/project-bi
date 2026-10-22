'use client';

import { useMemo, useState } from 'react';
import type { DashboardCard } from '@bi/contracts';
import {
  aggregateData,
  type DataSource,
  type DataTable,
} from '../../lib/data-sources';
import { EChartsView } from '../charts/echarts-view';
import * as echarts from 'echarts';
import {
  BarChart3,
  Check,
  FileSpreadsheet,
  PieChart,
  Table as TableIcon,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

export interface CreatedCardData {
  readonly title: string;
  readonly chartKind: DashboardCard['chartKind'];
  readonly echartsOption: echarts.EChartsOption;
  readonly summaryValue?: string;
  readonly sourceName: string;
  readonly tableName: string;
}

interface ChartCreatorModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dataSources: readonly DataSource[];
  readonly onCardCreated: (card: CreatedCardData) => void;
  readonly onOpenUploadExcel: () => void;
}

export function ChartCreatorModal({
  isOpen,
  onClose,
  dataSources,
  onCardCreated,
  onOpenUploadExcel,
}: ChartCreatorModalProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    dataSources[0]?.id || '',
  );
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [chartKind, setChartKind] = useState<DashboardCard['chartKind']>('bar_grouped');
  const [title, setTitle] = useState('');
  const [xField, setXField] = useState('');
  const [yField, setYField] = useState('');
  const [aggFn, setAggFn] = useState<'sum' | 'count' | 'avg' | 'min' | 'max'>('sum');

  // Derive current data source and tables
  const currentSource = useMemo(() => {
    return dataSources.find((ds) => ds.id === selectedSourceId) || dataSources[0];
  }, [dataSources, selectedSourceId]);

  const currentTable: DataTable | undefined = useMemo(() => {
    if (!currentSource || currentSource.tables.length === 0) return undefined;
    return (
      currentSource.tables.find((t) => t.id === selectedTableId) ||
      currentSource.tables[0]
    );
  }, [currentSource, selectedTableId]);

  // Sync default fields when table changes
  const availableColumns = currentTable?.columns || [];
  const activeXField = xField || availableColumns[0]?.name || '';
  const activeYField =
    yField || availableColumns.find((c) => c.type === 'number')?.name || availableColumns[0]?.name || '';

  // Auto-generate title if empty
  const computedTitle =
    title ||
    `${chartKind === 'bar_grouped' ? 'Ventas' : 'Métrica'} por ${activeXField || 'Categoría'}`;

  // Execute real aggregation on real rows
  const aggResult = useMemo(() => {
    if (!currentTable || currentTable.rows.length === 0 || !activeXField || !activeYField) {
      return { categories: [], values: [], totalSum: 0 };
    }
    return aggregateData(currentTable.rows, activeXField, activeYField, aggFn);
  }, [currentTable, activeXField, activeYField, aggFn]);

  // Build live ECharts preview option
  const previewOption = useMemo<echarts.EChartsOption>(() => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const categories = aggResult.categories as string[];
    const values = aggResult.values as number[];

    if (chartKind === 'donut') {
      return {
        tooltip: { trigger: 'item' },
        legend: { bottom: '0', left: 'center' },
        series: [
          {
            name: activeYField,
            type: 'pie',
            radius: ['45%', '70%'],
            data: categories.map((cat, i) => ({
              name: cat,
              value: values[i] ?? 0,
            })),
          },
        ],
      };
    }

    if (chartKind === 'line') {
      return {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: categories },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
        },
        series: [
          {
            name: activeYField,
            type: 'line',
            smooth: true,
            data: values,
            itemStyle: { color: '#8b5cf6' },
            areaStyle: { color: 'rgba(139, 92, 246, 0.15)' },
          },
        ],
      };
    }

    // Default bar chart
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      },
      series: [
        {
          name: `${aggFn.toUpperCase()}(${activeYField})`,
          type: 'bar',
          data: values,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ]),
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    };
  }, [aggResult, chartKind, activeYField, aggFn]);

  if (!isOpen) return null;

  const handleSaveCard = () => {
    onCardCreated({
      title: computedTitle,
      chartKind,
      echartsOption: previewOption,
      summaryValue: `$${aggResult.totalSum.toLocaleString()}`,
      sourceName: currentSource?.name || 'Fuente Local',
      tableName: currentTable?.name || 'Tabla',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Constructor Visual de Gráficas (In-Situ)</h2>
              <p className="text-xs text-muted">
                Selecciona tu fuente de datos (PostgreSQL o Excel), asigna ejes y mira el resultado en vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-surface-border transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Configuration Panel */}
          <div className="lg:col-span-5 p-5 border-r border-surface-border overflow-y-auto space-y-4">
            {/* 1. Data Source Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  1. Origen de Datos
                </label>
                <button
                  type="button"
                  onClick={onOpenUploadExcel}
                  className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                >
                  <FileSpreadsheet className="h-3 w-3" />
                  + Subir Excel/CSV
                </button>
              </div>

              <select
                value={currentSource?.id || ''}
                onChange={(e) => {
                  setSelectedSourceId(e.target.value);
                  setSelectedTableId('');
                }}
                className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                {dataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({ds.tables.length} {ds.type === 'excel' ? 'hojas' : 'tablas'})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Table / Sheet Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
                2. Tabla o Hoja
              </label>
              <select
                value={currentTable?.id || ''}
                onChange={(e) => {
                  setSelectedTableId(e.target.value);
                  setXField('');
                  setYField('');
                }}
                className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              >
                {currentSource?.tables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.name} ({tbl.rows.length} filas)
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Visual Chart Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                3. Tipo de Visualización
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bar_grouped', label: 'Barras', icon: BarChart3 },
                  { id: 'line', label: 'Línea', icon: TrendingUp },
                  { id: 'donut', label: 'Donut', icon: PieChart },
                  { id: 'kpi', label: 'KPI', icon: Zap },
                  { id: 'table_hierarchical', label: 'Tabla', icon: TableIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = chartKind === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChartKind(item.id as DashboardCard['chartKind'])}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-surface-border bg-surface hover:bg-surface-subtle text-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Axis & Dimension Assignment */}
            <div className="pt-2 border-t border-surface-border space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                4. Asignación de Campos
              </label>

              {/* X Axis */}
              <div>
                <span className="block text-[11px] text-muted mb-1 font-medium">
                  Eje X / Agrupación (Dimensión)
                </span>
                <select
                  value={activeXField}
                  onChange={(e) => setXField(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                >
                  {availableColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Y Axis & Aggregation */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-[11px] text-muted mb-1 font-medium">Métrica (Eje Y)</span>
                  <select
                    value={activeYField}
                    onChange={(e) => setYField(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    {availableColumns.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[11px] text-muted mb-1 font-medium">Operación</span>
                  <select
                    value={aggFn}
                    onChange={(e) => setAggFn(e.target.value as typeof aggFn)}
                    className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="sum">SUM (Suma)</option>
                    <option value="count">COUNT (Conteo)</option>
                    <option value="avg">AVG (Promedio)</option>
                    <option value="max">MAX (Máximo)</option>
                    <option value="min">MIN (Mínimo)</option>
                  </select>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <span className="block text-[11px] text-muted mb-1 font-medium">Título de la Tarjeta</span>
                <input
                  type="text"
                  value={title}
                  placeholder={computedTitle}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-surface px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Right Live Preview Panel */}
          <div className="lg:col-span-7 p-6 bg-surface-subtle flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Vista Previa en Vivo
                  </span>
                  <h3 className="text-base font-bold text-foreground">{computedTitle}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted block">Filas procesadas</span>
                  <span className="text-xs font-bold text-foreground">
                    {currentTable?.rows.length || 0} registros
                  </span>
                </div>
              </div>

              {/* Render dynamic preview */}
              <div className="rounded-2xl border border-surface-border bg-surface p-4 shadow-sm min-h-[300px] flex items-center justify-center">
                {chartKind === 'kpi' ? (
                  <div className="text-center py-8 space-y-2">
                    <span className="text-xs font-medium text-muted uppercase tracking-wider">
                      {aggFn.toUpperCase()} de {activeYField}
                    </span>
                    <div className="text-4xl font-extrabold text-foreground">
                      ${aggResult.totalSum.toLocaleString()}
                    </div>
                    <div className="text-xs text-success font-medium flex items-center justify-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Calculado dinámicamente sobre {currentTable?.rows.length} filas
                    </div>
                  </div>
                ) : chartKind === 'table_hierarchical' ? (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-surface-border text-muted font-medium bg-surface-subtle">
                        <tr>
                          <th className="py-2 px-3">{activeXField}</th>
                          <th className="py-2 px-3 text-right">
                            {aggFn.toUpperCase()}({activeYField})
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {aggResult.categories.slice(0, 5).map((cat, i) => (
                          <tr key={i} className="text-foreground">
                            <td className="py-2 px-3 font-medium">{cat}</td>
                            <td className="py-2 px-3 text-right">
                              ${(aggResult.values[i] ?? 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EChartsView options={previewOption} height={280} />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-surface-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-border transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all"
              >
                <Check className="h-4 w-4" />
                Insertar Tarjeta en el Canvas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
