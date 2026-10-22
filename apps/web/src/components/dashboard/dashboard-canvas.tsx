'use client';

import { useState } from 'react';
import * as echarts from 'echarts';
import type { DashboardCard, DashboardDocument } from '@bi/contracts';
import { EChartsView } from '../charts/echarts-view';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Maximize2,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  TrendingUp,
} from 'lucide-react';

export interface DynamicCard {
  readonly title: string;
  readonly chartKind: DashboardCard['chartKind'];
  readonly echartsOption: echarts.EChartsOption;
  readonly sourceName: string;
  readonly tableName: string;
  readonly summaryValue?: string;
}

interface DashboardCanvasProps {
  readonly initialDocument: DashboardDocument;
  readonly dynamicCards: readonly DynamicCard[];
  readonly onDeleteCard: (index: number) => void;
  readonly onNavigateToBuilder: () => void;
}

export function DashboardCanvas({
  initialDocument,
  dynamicCards,
  onDeleteCard,
  onNavigateToBuilder,
}: DashboardCanvasProps) {
  const [doc] = useState<DashboardDocument>(initialDocument);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Default Bar Chart Configuration
  const barChartOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Tecnología', 'Oficina', 'Servicios', 'Consultoría'],
      axisLine: { lineStyle: { color: 'hsl(var(--surface-border))' } },
      axisLabel: { color: 'hsl(var(--foreground))' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'hsl(var(--surface-subtle))' } },
      axisLabel: { color: 'hsl(var(--foreground))' },
    },
    series: [
      {
        name: 'Ventas 2026',
        type: 'bar',
        data: [4250, 1820, 2950, 1400],
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

  // Default Line Chart Configuration
  const lineChartOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      axisLine: { lineStyle: { color: 'hsl(var(--surface-border))' } },
      axisLabel: { color: 'hsl(var(--foreground))' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'hsl(var(--surface-subtle))' } },
      axisLabel: { color: 'hsl(var(--foreground))' },
    },
    series: [
      {
        name: 'Ingresos',
        type: 'line',
        smooth: true,
        data: [1200, 2400, 3100, 4800],
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: 'rgba(139, 92, 246, 0.15)',
        },
      },
    ],
  };

  // Default Donut Chart Configuration
  const donutChartOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center', textStyle: { color: 'hsl(var(--foreground))' } },
    series: [
      {
        name: 'Distribución',
        type: 'pie',
        radius: ['50%', '75%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: [
          { value: 1048, name: 'Ecuador' },
          { value: 735, name: 'Argentina' },
          { value: 580, name: 'Colombia' },
          { value: 484, name: 'Chile' },
        ],
      },
    ],
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6 bg-background">
      {/* Top Action Bar (Metabase Page 24 Executive Dashboard Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.title}</h1>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success flex items-center gap-1.5 border border-success/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Tiempo Real (SSE)
            </span>
          </div>
          <p className="text-sm text-muted mt-0.5">{doc.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dashboard Filters (Metabase-style) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs text-muted shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">Este trimestre</span>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={onNavigateToBuilder}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ Añadir Pregunta</span>
          </button>

          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-foreground text-xs font-semibold hover:bg-surface-subtle transition-all shadow-sm">
            <Share2 className="h-3.5 w-3.5 text-muted" />
            <span>Compartir</span>
          </button>
        </div>
      </div>

      {/* Dynamic Cards Created by User via Builder */}
      {dynamicCards.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-primary">
              Preguntas Añadidas Recientemente ({dynamicCards.length})
            </h2>
            <span className="text-xs text-muted">Construidas y vinculadas al tablero</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dynamicCards.map((card, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground">{card.title}</h3>
                    <p className="text-xs text-muted">
                      Origen: {card.sourceName} &bull; {card.tableName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteCard(idx)}
                      className="rounded-lg p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      title="Eliminar tarjeta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {card.chartKind === 'kpi' ? (
                  <div className="py-6 text-center space-y-1">
                    <div className="text-4xl font-extrabold text-foreground">{card.summaryValue}</div>
                    <div className="text-xs text-success font-medium">Métrica calculada en vivo</div>
                  </div>
                ) : (
                  <EChartsView options={card.echartsOption} height={280} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Ingresos Totales</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">$12,490.00</div>
          <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+18.4% vs mes anterior</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Órdenes Completadas</span>
            <BarChart3 className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">148</div>
          <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+9.2% de conversión</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Promedio</span>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">$84.39</div>
          <div className="text-xs text-muted font-medium">Promedio por cliente activo</div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Disponibilidad en Caja</span>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">$145,000.00</div>
          <div className="text-xs text-muted font-medium">Cuenta 111 (Disponible)</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Ventas por Categoría de Producto</h3>
              <p className="text-xs text-muted">Calculado desde tabla retail_demo.products & order_items</p>
            </div>
            <Maximize2 className="h-4 w-4 text-muted hover:text-foreground cursor-pointer transition-colors" />
          </div>
          <EChartsView options={barChartOption} height={280} />
        </div>

        {/* Chart 2: Donut Chart */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Distribución Geográfica</h3>
              <p className="text-xs text-muted">País de destino de envíos</p>
            </div>
          </div>
          <EChartsView options={donutChartOption} height={280} />
        </div>
      </div>

      {/* Second Row: Hierarchical Financial Table & Growth Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hierarchical Accounts Table (Metabase Page 25 Plan de Cuentas) */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Plan de Cuentas (Reporte Jerárquico)</h3>
              <p className="text-xs text-muted">Estructura de balance con niveles 1 &gt; 11 &gt; 111</p>
            </div>
            <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg">
              Pixel-Perfect PDF/Excel
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-surface-border">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border text-foreground font-semibold bg-surface-subtle">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Nombre de Cuenta</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <tr className="font-bold text-foreground bg-surface-subtle/40">
                  <td className="py-2.5 px-3">1</td>
                  <td className="py-2.5 px-3">ACTIVO</td>
                  <td className="py-2.5 px-3">Activo</td>
                  <td className="py-2.5 px-3 text-right font-mono">$485,000.00</td>
                </tr>
                <tr className="font-semibold text-foreground">
                  <td className="py-2 px-3 pl-6">11</td>
                  <td className="py-2 px-3">Activo Corriente</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right font-mono">$310,000.00</td>
                </tr>
                <tr className="text-muted">
                  <td className="py-2 px-3 pl-9">111</td>
                  <td className="py-2 px-3">Disponible</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right font-mono">$145,000.00</td>
                </tr>
                <tr className="text-muted">
                  <td className="py-2 px-3 pl-12">11101</td>
                  <td className="py-2 px-3">Caja General</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right font-mono">$25,000.00</td>
                </tr>
                <tr className="text-muted">
                  <td className="py-2 px-3 pl-12">11102</td>
                  <td className="py-2 px-3">Bancos Nacionales</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right font-mono">$120,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth Line Chart */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Tendencia de Ingresos Semanal</h3>
              <p className="text-xs text-muted">Evolución en tiempo real</p>
            </div>
          </div>
          <EChartsView options={lineChartOption} height={260} />
        </div>
      </div>
    </div>
  );
}
