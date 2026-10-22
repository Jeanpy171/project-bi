'use client';

import { useState } from 'react';
import * as echarts from 'echarts';
import type { DashboardCard, DashboardDocument } from '@bi/contracts';
import { EChartsView } from '../charts/echarts-view';
import {
  BarChart3,
  ChevronRight,
  DollarSign,
  Maximize2,
  PieChart,
  Plus,
  RefreshCw,
  Share2,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react';

interface DashboardCanvasProps {
  readonly initialDocument: DashboardDocument;
  readonly onOpenConnectionModal: () => void;
}

export function DashboardCanvas({ initialDocument, onOpenConnectionModal }: DashboardCanvasProps) {
  const [doc, setDoc] = useState<DashboardDocument>(initialDocument);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('Nuevo Gráfico de Ventas');
  const [selectedChartType, setSelectedChartType] = useState<DashboardCard['chartKind']>('bar_grouped');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleAddCardInSitu = () => {
    const newCard: DashboardCard = {
      id: crypto.randomUUID(),
      title: newCardTitle,
      chartKind: selectedChartType,
      encoding: {
        xField: 'category',
        yFields: ['total'],
      },
      style: {
        showLegend: true,
        isSmooth: true,
      },
      query: {
        connectionId: '123e4567-e89b-12d3-a456-426614174000',
        rawSql: 'SELECT category, SUM(total) as total FROM sales GROUP BY category;',
        cacheTtlSeconds: 30,
      },
      layout: {
        x: 0,
        y: 10,
        w: 6,
        h: 4,
        minW: 3,
        minH: 3,
      },
    };

    setDoc({
      ...doc,
      cards: [...doc.cards, newCard],
      updatedAt: new Date().toISOString(),
    });
    setIsAddingCard(false);
  };

  // Sample ECharts configurations
  const barChartOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Tecnología', 'Oficina', 'Servicios', 'Consultoría'],
      axisLine: { lineStyle: { color: 'hsl(var(--muted))' } },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'hsl(var(--surface-border))' } },
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

  const lineChartOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    },
    yAxis: { type: 'value' },
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

  const donutChartOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center' },
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
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.title}</h1>
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              En vivo (SSE)
            </span>
          </div>
          <p className="text-sm text-muted mt-0.5">{doc.description}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenConnectionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors shadow-sm"
          >
            Conexión BDD
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-medium text-foreground hover:bg-surface-subtle transition-colors shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refrescar
          </button>

          <button
            onClick={() => setIsAddingCard(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva Tarjeta (In-Situ)
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity shadow-sm">
            <Share2 className="h-3.5 w-3.5" />
            Compartir
          </button>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Ingresos Totales</span>
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">$12,490.00</div>
          <div className="flex items-center gap-1.5 text-xs text-success font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+18.4% vs mes anterior</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Órdenes Completadas</span>
            <BarChart3 className="h-4 w-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">148</div>
          <div className="flex items-center gap-1.5 text-xs text-success font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+9.2% de conversión</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Ticket Promedio</span>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">$84.39</div>
          <div className="text-xs text-muted">Promedio por cliente activo</div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-2 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">Disponibilidad en Caja</span>
            <DollarSign className="h-4 w-4 text-success" />
          </div>
          <div className="text-2xl font-bold text-foreground">$145,000.00</div>
          <div className="text-xs text-muted">Cuenta 111 (Disponible)</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Bar Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Ventas por Categoría de Producto</h3>
              <p className="text-xs text-muted">Calculado desde tabla retail_demo.products & order_items</p>
            </div>
            <Maximize2 className="h-4 w-4 text-muted hover:text-foreground cursor-pointer transition-colors" />
          </div>
          <EChartsView options={barChartOption} height={280} />
        </div>

        {/* Chart 2: Donut Chart */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Distribución Geográfica</h3>
              <p className="text-xs text-muted">País de destino de envíos</p>
            </div>
          </div>
          <EChartsView options={donutChartOption} height={280} />
        </div>
      </div>

      {/* Second Row: Hierarchical Financial Table & Growth Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hierarchical Accounts Table (Diferenciador contable/ejecutivo) */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Plan de Cuentas (Reporte Jerárquico)</h3>
              <p className="text-xs text-muted">Estructura de balance con niveles 1 &gt; 11 &gt; 111</p>
            </div>
            <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
              Pixel-Perfect PDF/Excel
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-surface-border text-muted font-medium bg-surface-subtle">
                <tr>
                  <th className="py-2 px-3">Código</th>
                  <th className="py-2 px-3">Nombre de Cuenta</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <tr className="font-bold text-foreground bg-surface-subtle/50">
                  <td className="py-2.5 px-3">1</td>
                  <td className="py-2.5 px-3">ACTIVO</td>
                  <td className="py-2.5 px-3">Activo</td>
                  <td className="py-2.5 px-3 text-right">$485,000.00</td>
                </tr>
                <tr className="font-semibold text-foreground">
                  <td className="py-2 px-3 pl-6">11</td>
                  <td className="py-2 px-3">Activo Corriente</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right">$310,000.00</td>
                </tr>
                <tr className="text-muted">
                  <td className="py-2 px-3 pl-9">111</td>
                  <td className="py-2 px-3">Disponible</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right">$145,000.00</td>
                </tr>
                <tr className="text-muted">
                  <td className="py-2 px-3 pl-12">11101</td>
                  <td className="py-2 px-3">Caja General</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right">$25,000.00</td>
                </tr>
                <tr className="text-muted">
                  <td className="py-2 px-3 pl-12">11102</td>
                  <td className="py-2 px-3">Bancos Nacionales</td>
                  <td className="py-2 px-3">Activo</td>
                  <td className="py-2 px-3 text-right">$120,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth Line Chart */}
        <div className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Tendencia de Ingresos Semanal</h3>
              <p className="text-xs text-muted">Evolución en tiempo real</p>
            </div>
          </div>
          <EChartsView options={lineChartOption} height={260} />
        </div>
      </div>

      {/* In-Situ Card Creation Modal / Drawer */}
      {isAddingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-surface-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Crear Tarjeta Directo en el Canvas</h3>
            <p className="text-xs text-muted">
              Sin salir del tablero ni guardar preguntas intermedias en carpetas separadas.
            </p>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Título de la Tarjeta</label>
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-2">Tipo de Visualización</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bar_grouped', label: 'Barras', icon: BarChart3 },
                  { id: 'donut', label: 'Donut', icon: PieChart },
                  { id: 'table_hierarchical', label: 'Tabla', icon: TableIcon },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedChartType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedChartType(item.id as DashboardCard['chartKind'])}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-surface-border bg-surface hover:bg-surface-subtle text-muted'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddingCard(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCardInSitu}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
              >
                Insertar en Canvas
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
