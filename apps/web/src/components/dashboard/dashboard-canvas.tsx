'use client';

import { useMemo, useState } from 'react';
import * as echarts from 'echarts';
import type { DashboardCard, DashboardDocument } from '@bi/contracts';
import { EChartsView } from '../charts/echarts-view';
import {
  buildModernBarOption,
  buildModernDonutOption,
  buildModernLineOption,
} from '../../lib/chart-theme';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  Edit3,
  GripVertical,
  Maximize2,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';

export type CardWidth = 3 | 4 | 6 | 8 | 12;
export type CardHighlight = 'none' | 'primary' | 'emerald' | 'amber' | 'purple';

export interface GridCardItem {
  readonly id: string;
  title: string;
  subtitle?: string;
  chartKind: DashboardCard['chartKind'] | 'kpi' | 'plan_cuentas';
  summaryValue?: string;
  trendText?: string;
  sourceName?: string;
  tableName?: string;
  echartsOption?: echarts.EChartsOption;
  width: CardWidth;
  highlight: CardHighlight;
  badge?: string;
}

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
  readonly isDarkMode: boolean;
}

export function DashboardCanvas({
  initialDocument,
  dynamicCards,
  onNavigateToBuilder,
  isDarkMode,
}: DashboardCanvasProps) {
  const [doc] = useState<DashboardDocument>(initialDocument);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Base Chart Options (computed dynamically based on active theme)
  const defaultBarOption = useMemo(
    () =>
      buildModernBarOption(
        ['Tecnología', 'Oficina', 'Servicios', 'Consultoría'],
        [4250, 1820, 2950, 1400],
        'Ventas 2026',
        isDarkMode,
      ),
    [isDarkMode],
  );

  const defaultLineOption = useMemo(
    () =>
      buildModernLineOption(
        ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
        [1200, 2400, 3100, 4800],
        'Ingresos',
        isDarkMode,
      ),
    [isDarkMode],
  );

  const defaultDonutOption = useMemo(
    () =>
      buildModernDonutOption(
        [
          { name: 'Ecuador', value: 1048 },
          { name: 'Argentina', value: 735 },
          { name: 'Colombia', value: 580 },
          { name: 'Chile', value: 484 },
        ],
        'Distribución',
        isDarkMode,
      ),
    [isDarkMode],
  );

  // Unified Dashboard Cards State
  const [cards, setCards] = useState<GridCardItem[]>([
    {
      id: 'kpi-ingresos',
      title: 'Ingresos Totales',
      chartKind: 'kpi',
      summaryValue: '$12,490.00',
      trendText: '+18.4% vs mes anterior',
      width: 3,
      highlight: 'emerald',
      badge: 'Meta Superada',
    },
    {
      id: 'kpi-ordenes',
      title: 'Órdenes Completadas',
      chartKind: 'kpi',
      summaryValue: '148',
      trendText: '+9.2% de conversión',
      width: 3,
      highlight: 'primary',
      badge: 'Operativo',
    },
    {
      id: 'kpi-ticket',
      title: 'Ticket Promedio',
      chartKind: 'kpi',
      summaryValue: '$84.39',
      trendText: 'Promedio por cliente activo',
      width: 3,
      highlight: 'none',
    },
    {
      id: 'kpi-caja',
      title: 'Disponibilidad en Caja',
      chartKind: 'kpi',
      summaryValue: '$145,000.00',
      trendText: 'Cuenta 111 (Disponible)',
      width: 3,
      highlight: 'amber',
      badge: 'Métrica Clave',
    },
    {
      id: 'chart-ventas-categoria',
      title: 'Ventas por Categoría de Producto',
      subtitle: 'Calculado desde retail_demo.products & order_items',
      chartKind: 'bar_grouped',
      width: 8,
      highlight: 'none',
    },
    {
      id: 'chart-distribucion-geo',
      title: 'Distribución Geográfica',
      subtitle: 'País de destino de envíos',
      chartKind: 'donut',
      width: 4,
      highlight: 'none',
    },
    {
      id: 'table-plan-cuentas',
      title: 'Plan de Cuentas (Reporte Jerárquico)',
      subtitle: 'Estructura de balance con niveles 1 > 11 > 111',
      chartKind: 'plan_cuentas',
      width: 6,
      highlight: 'primary',
      badge: 'Pixel-Perfect',
    },
    {
      id: 'chart-tendencia-ingresos',
      title: 'Tendencia de Ingresos Semanal',
      subtitle: 'Evolución en tiempo real',
      chartKind: 'line',
      width: 6,
      highlight: 'none',
    },
  ]);

  // Synchronize incoming dynamic cards created by user from Builder
  useMemo(() => {
    if (dynamicCards.length === 0) return;

    setCards((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const newItems: GridCardItem[] = [];

      dynamicCards.forEach((dc, idx) => {
        const id = `dynamic-${dc.title.toLowerCase().replace(/\s+/g, '-')}-${idx}`;
        if (!existingIds.has(id)) {
          newItems.push({
            id,
            title: dc.title,
            subtitle: `Origen: ${dc.sourceName} • ${dc.tableName}`,
            chartKind: dc.chartKind,
            summaryValue: dc.summaryValue,
            echartsOption: dc.echartsOption,
            width: dc.chartKind === 'kpi' ? 4 : 6,
            highlight: dc.chartKind === 'kpi' ? 'emerald' : 'none',
            badge: 'Personalizada',
          });
        }
      });

      return newItems.length > 0 ? [...newItems, ...prev] : prev;
    });
  }, [dynamicCards]);

  // Card Width & Highlight Mutators
  const updateCardWidth = (id: string, width: CardWidth) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, width } : c)));
  };

  const updateCardHighlight = (id: string, highlight: CardHighlight) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, highlight } : c)));
  };

  const deleteCardById = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    setCards((prev) => {
      const next = [...prev];
      const item = next[index];
      if (!item) return prev;
      next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedCardId || draggedCardId === targetId) return;

    setCards((prev) => {
      const fromIdx = prev.findIndex((c) => c.id === draggedCardId);
      const toIdx = prev.findIndex((c) => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      if (moved) next.splice(toIdx, 0, moved);
      return next;
    });

    setDraggedCardId(null);
  };

  // Helper class generators for width
  const getColSpanClass = (w: CardWidth): string => {
    switch (w) {
      case 3:
        return 'col-span-12 sm:col-span-6 lg:col-span-3';
      case 4:
        return 'col-span-12 sm:col-span-6 lg:col-span-4';
      case 6:
        return 'col-span-12 lg:col-span-6';
      case 8:
        return 'col-span-12 lg:col-span-8';
      case 12:
        return 'col-span-12';
    }
  };

  // Helper style generator for highlight
  const getHighlightClass = (h: CardHighlight): string => {
    switch (h) {
      case 'primary':
        return 'border-primary/50 shadow-md ring-1 ring-primary/20';
      case 'emerald':
        return 'border-success/50 shadow-md ring-1 ring-success/20';
      case 'amber':
        return 'border-amber-500/50 shadow-md ring-1 ring-amber-500/20';
      case 'purple':
        return 'border-accent/50 shadow-md ring-1 ring-accent/20';
      case 'none':
      default:
        return 'border-surface-border shadow-sm';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full space-y-6 bg-background">
      {/* Top Action Bar (Metabase Executive Style, Full Width) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.title}</h1>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success flex items-center gap-1.5 border border-success/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Tiempo Real (SSE)
            </span>
            {isEditMode && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary flex items-center gap-1.5 border border-primary/20 animate-bounce">
                <Sparkles className="h-3.5 w-3.5" />
                Modo Edición Activo
              </span>
            )}
          </div>
          <p className="text-sm text-muted mt-0.5">{doc.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dashboard Period Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs text-muted shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">Este trimestre</span>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          {/* Toggle Edit / Layout Mode Button */}
          <button
            onClick={() => setIsEditMode((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isEditMode
                ? 'border-primary bg-primary text-white shadow-primary/20'
                : 'border-surface-border bg-surface text-foreground hover:bg-surface-subtle'
            }`}
          >
            {isEditMode ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
            <span>{isEditMode ? 'Terminar Edición' : 'Personalizar Cuadrícula'}</span>
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

      {/* Edit Mode Instruction Banner */}
      {isEditMode && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold shrink-0">
              <GripVertical className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold block">Modo de Personalización y Cuadrícula Flexible</span>
              <span className="text-muted block text-[11px]">
                Arrastrá las tarjetas desde el asa ⠿ o usá las flechas para reordenar. Cambiá su tamaño (1/4 a Completo) y destacá métricas clave con resaltados.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsEditMode(false)}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover shrink-0 shadow-sm"
          >
            Guardar Cambios
          </button>
        </div>
      )}

      {/* Unified 12-Column Flexible Grid */}
      <div className="grid grid-cols-12 gap-5 w-full">
        {cards.map((card, idx) => {
          const colSpanClass = getColSpanClass(card.width);
          const highlightClass = getHighlightClass(card.highlight);

          return (
            <div
              key={card.id}
              draggable={isEditMode}
              onDragStart={() => handleDragStart(card.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(card.id)}
              className={`${colSpanClass} ${highlightClass} rounded-2xl bg-surface p-5 flex flex-col justify-between transition-all duration-200 relative group hover:border-primary/40`}
            >
              {/* Highlight Top Accent Bar */}
              {card.highlight !== 'none' && (
                <div
                  className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                    card.highlight === 'emerald'
                      ? 'bg-success'
                      : card.highlight === 'amber'
                      ? 'bg-amber-500'
                      : card.highlight === 'purple'
                      ? 'bg-accent'
                      : 'bg-primary'
                  }`}
                />
              )}

              {/* Card Header */}
              <div className="space-y-1 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* Drag Handle in Edit Mode */}
                    {isEditMode && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-subtle text-muted hover:text-foreground"
                        title="Arrastrar para mover"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground tracking-tight">
                          {card.title}
                        </h3>
                        {card.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              card.highlight === 'emerald'
                                ? 'bg-success/10 text-success border border-success/20'
                                : card.highlight === 'amber'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : card.highlight === 'purple'
                                ? 'bg-accent/10 text-accent border border-accent/20'
                                : 'bg-primary/10 text-primary border border-primary/20'
                            }`}
                          >
                            {card.badge}
                          </span>
                        )}
                      </div>
                      {card.subtitle && (
                        <p className="text-[11px] text-muted mt-0.5">{card.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Standard Actions (Delete, Maximize) */}
                  <div className="flex items-center gap-1">
                    {isEditMode && (
                      <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-lg border border-surface-border">
                        <button
                          onClick={() => moveCard(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                          title="Mover arriba / izquierda"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveCard(idx, 'down')}
                          disabled={idx === cards.length - 1}
                          className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                          title="Mover abajo / derecha"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteCardById(card.id)}
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors ml-1"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {!isEditMode && (
                      <button className="text-muted hover:text-foreground p-1 transition-colors">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit Controls Toolbar inside Card Header (Span Switcher & Highlights) */}
                {isEditMode && (
                  <div className="pt-2 mt-2 border-t border-surface-border flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    {/* Width Span Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-muted font-semibold mr-1">Ancho:</span>
                      {[
                        { w: 3 as CardWidth, label: '1/4' },
                        { w: 4 as CardWidth, label: '1/3' },
                        { w: 6 as CardWidth, label: '1/2' },
                        { w: 8 as CardWidth, label: '2/3' },
                        { w: 12 as CardWidth, label: 'Full' },
                      ].map((item) => (
                        <button
                          key={item.w}
                          onClick={() => updateCardWidth(card.id, item.w)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                            card.width === item.w
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-surface-subtle hover:bg-surface-border text-foreground'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Highlight Color Picker */}
                    <div className="flex items-center gap-1">
                      <span className="text-muted font-semibold mr-1">Resaltar:</span>
                      {[
                        { h: 'none' as CardHighlight, color: 'bg-slate-300 dark:bg-slate-700', label: 'Normal' },
                        { h: 'primary' as CardHighlight, color: 'bg-primary', label: 'Azul' },
                        { h: 'emerald' as CardHighlight, color: 'bg-success', label: 'Meta' },
                        { h: 'amber' as CardHighlight, color: 'bg-amber-500', label: 'VIP' },
                        { h: 'purple' as CardHighlight, color: 'bg-accent', label: 'Estratégico' },
                      ].map((hl) => (
                        <button
                          key={hl.h}
                          onClick={() => updateCardHighlight(card.id, hl.h)}
                          title={`Resaltado: ${hl.label}`}
                          className={`h-4 w-4 rounded-full ${hl.color} transition-transform ${
                            card.highlight === hl.h ? 'ring-2 ring-foreground scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Body Renderers */}
              <div className="flex-1 flex flex-col justify-center">
                {card.chartKind === 'kpi' && (
                  <div className="py-4 space-y-1">
                    <div className="text-3xl font-black text-foreground tracking-tight">
                      {card.summaryValue}
                    </div>
                    {card.trendText && (
                      <div className="flex items-center gap-1 text-xs text-success font-semibold">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{card.trendText}</span>
                      </div>
                    )}
                  </div>
                )}

                {card.chartKind === 'bar_grouped' && (
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={card.echartsOption || defaultBarOption}
                    height={280}
                  />
                )}

                {card.chartKind === 'donut' && (
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={card.echartsOption || defaultDonutOption}
                    height={280}
                  />
                )}

                {card.chartKind === 'line' && (
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={card.echartsOption || defaultLineOption}
                    height={260}
                  />
                )}

                {card.chartKind === 'plan_cuentas' && (
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
                          <td className="py-2 px-3">1</td>
                          <td className="py-2 px-3">ACTIVO TOTAL</td>
                          <td className="py-2 px-3">Activo</td>
                          <td className="py-2 px-3 text-right font-mono">$625,000.00</td>
                        </tr>
                        <tr className="font-semibold text-foreground">
                          <td className="py-2 px-3 pl-6">11</td>
                          <td className="py-2 px-3">Activo Corriente</td>
                          <td className="py-2 px-3">Activo</td>
                          <td className="py-2 px-3 text-right font-mono">$385,000.00</td>
                        </tr>
                        <tr className="text-muted">
                          <td className="py-2 px-3 pl-9">111</td>
                          <td className="py-2 px-3">Disponible en Bancos</td>
                          <td className="py-2 px-3">Activo</td>
                          <td className="py-2 px-3 text-right font-mono">$165,000.00</td>
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
                          <td className="py-2 px-3 text-right font-mono">$140,000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
