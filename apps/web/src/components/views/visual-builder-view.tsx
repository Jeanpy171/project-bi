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
  PieChart,
  Save,
  Table as TableIcon,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface VisualBuilderViewProps {
  readonly dataSources: readonly DataSource[];
  readonly preselectedSourceId?: string;
  readonly preselectedTableId?: string;
  readonly onSaveToDashboard: (card: {
    title: string;
    chartKind: DashboardCard['chartKind'];
    echartsOption: echarts.EChartsOption;
    sourceName: string;
    tableName: string;
    summaryValue?: string;
  }) => void;
  readonly onOpenUploadExcel: () => void;
}

export function VisualBuilderView({
  dataSources,
  preselectedSourceId,
  preselectedTableId,
  onSaveToDashboard,
  onOpenUploadExcel,
}: VisualBuilderViewProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    preselectedSourceId || dataSources[0]?.id || '',
  );
  const [selectedTableId, setSelectedTableId] = useState<string>(
    preselectedTableId || '',
  );
  const [chartKind, setChartKind] = useState<DashboardCard['chartKind']>('bar_grouped');
  const [title, setTitle] = useState('');
  const [xField, setXField] = useState('');
  const [yField, setYField] = useState('');
  const [aggFn, setAggFn] = useState<'sum' | 'count' | 'avg' | 'min' | 'max'>('sum');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Derive source and table
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

  const availableColumns = currentTable?.columns || [];
  const activeXField = xField || availableColumns[0]?.name || '';
  const activeYField =
    yField || availableColumns.find((c) => c.type === 'number')?.name || availableColumns[0]?.name || '';

  const computedTitle =
    title ||
    `${chartKind === 'bar_grouped' ? 'Ventas' : 'Métricas'} por ${activeXField || 'Dimensión'}`;

  // Execute Real Aggregation
  const aggResult = useMemo(() => {
    if (!currentTable || currentTable.rows.length === 0 || !activeXField || !activeYField) {
      return { categories: [], values: [], totalSum: 0 };
    }
    return aggregateData(currentTable.rows, activeXField, activeYField, aggFn);
  }, [currentTable, activeXField, activeYField, aggFn]);

  // Build ECharts Configuration
  const chartOption = useMemo<echarts.EChartsOption>(() => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const categories = aggResult.categories as string[];
    const values = aggResult.values as number[];

    if (chartKind === 'donut') {
      return {
        tooltip: { trigger: 'item' },
        legend: { bottom: '0', left: 'center', textStyle: { color: isDark ? '#94a3b8' : '#334155' } },
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
        xAxis: {
          type: 'category',
          data: categories,
          axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
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

    // Default bar
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
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
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [aggResult, chartKind, activeYField, aggFn]);

  const handleSave = () => {
    onSaveToDashboard({
      title: computedTitle,
      chartKind,
      echartsOption: chartOption,
      sourceName: currentSource?.name || 'Origen',
      tableName: currentTable?.name || 'Tabla',
      summaryValue: `$${aggResult.totalSum.toLocaleString()}`,
    });
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Left Configuration Drawer (Inspired by Metabase Page 21-23) */}
      <div className="w-80 border-r border-surface-border bg-surface flex flex-col p-5 gap-5 shrink-0 overflow-y-auto">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Paso 1: Origen y Tabla
          </span>
          <div className="space-y-2 mt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted">Origen de Datos</span>
                <button
                  type="button"
                  onClick={onOpenUploadExcel}
                  className="text-[11px] text-primary font-semibold hover:underline"
                >
                  + Subir Excel
                </button>
              </div>
              <select
                value={currentSource?.id || ''}
                onChange={(e) => {
                  setSelectedSourceId(e.target.value);
                  setSelectedTableId('');
                }}
                className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                {dataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-muted mb-1">Tabla o Hoja</span>
              <select
                value={currentTable?.id || ''}
                onChange={(e) => {
                  setSelectedTableId(e.target.value);
                  setXField('');
                  setYField('');
                }}
                className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                {currentSource?.tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rows.length} filas)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Axis & Aggregation */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Paso 2: Asignación de Campos
          </span>

          <div>
            <span className="block text-[11px] font-medium text-muted mb-1">
              Eje X (Agrupar por / Dimensión)
            </span>
            <select
              value={activeXField}
              onChange={(e) => setXField(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            >
              {availableColumns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[11px] font-medium text-muted mb-1">Métrica (Eje Y)</span>
              <select
                value={activeYField}
                onChange={(e) => setYField(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                {availableColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-medium text-muted mb-1">Operación</span>
              <select
                value={aggFn}
                onChange={(e) => setAggFn(e.target.value as typeof aggFn)}
                className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="sum">SUM</option>
                <option value="count">COUNT</option>
                <option value="avg">AVG</option>
                <option value="max">MAX</option>
                <option value="min">MIN</option>
              </select>
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-medium text-muted mb-1">Título de la Pregunta</span>
            <input
              type="text"
              value={title}
              placeholder={computedTitle}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>
        </div>

        {/* Save CTA */}
        <div className="mt-auto pt-4 border-t border-surface-border space-y-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
          >
            {isSavedFeedback ? <Check className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
            <span>{isSavedFeedback ? '¡Guardado en Dashboard!' : 'Guardar en Dashboard'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas with Chart & Bottom Toolbar (Metabase Page 21-23) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Breadcrumb Header */}
        <div className="p-4 border-b border-surface-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-medium">{currentSource?.name} &gt;</span>
            <span className="text-xs text-muted font-medium">{currentTable?.name} &gt;</span>
            <h2 className="text-sm font-bold text-foreground">{computedTitle}</h2>
          </div>

          <div className="text-xs font-medium text-muted">
            {currentTable?.rows.length || 0} registros calculados
          </div>
        </div>

        {/* Central Visualization Canvas */}
        <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-4xl rounded-2xl border border-surface-border bg-surface p-6 shadow-sm min-h-[420px] flex items-center justify-center">
            {chartKind === 'kpi' ? (
              <div className="text-center py-12 space-y-2">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  {aggFn.toUpperCase()} de {activeYField}
                </span>
                <div className="text-5xl font-black text-foreground">
                  ${aggResult.totalSum.toLocaleString()}
                </div>
                <div className="text-xs text-success font-medium flex items-center justify-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  Calculado dinámicamente sobre {currentTable?.rows.length} registros
                </div>
              </div>
            ) : chartKind === 'table_hierarchical' ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-surface-border text-foreground font-bold bg-surface-subtle">
                    <tr>
                      <th className="py-2.5 px-3">{activeXField}</th>
                      <th className="py-2.5 px-3 text-right">
                        {aggFn.toUpperCase()}({activeYField})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {aggResult.categories.map((cat, i) => (
                      <tr key={i} className="text-foreground">
                        <td className="py-2 px-3 font-medium">{cat}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          ${(aggResult.values[i] ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EChartsView options={chartOption} height={380} />
            )}
          </div>
        </div>

        {/* Bottom Visualization Toolbar (Metabase Page 21 Toolbar) */}
        <div className="p-3 border-t border-surface-border bg-surface flex items-center justify-center gap-2 shrink-0 shadow-sm">
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
                onClick={() => setChartKind(item.id as DashboardCard['chartKind'])}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-surface-border bg-surface hover:bg-surface-subtle text-foreground/80'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
