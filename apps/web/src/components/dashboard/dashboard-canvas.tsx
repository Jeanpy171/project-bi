'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as echarts from 'echarts';
import type { DashboardCard, DashboardDocument } from '@bi/contracts';
import { EChartsView } from '../charts/echarts-view';
import {
  buildModernBarOption,
  buildModernDonutOption,
  buildModernLineOption,
} from '../../lib/chart-theme';
import { CardExpandModal } from './card-expand-modal';
import { ShareDashboardModal } from './share-dashboard-modal';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  Edit2,
  Edit3,
  GripVertical,
  Heading,
  Maximize2,
  Plus,
  RefreshCw,
  Share2,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export type CardWidth = 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface GridCardItem {
  readonly id: string;
  title: string;
  subtitle?: string;
  chartKind: DashboardCard['chartKind'] | 'kpi' | 'plan_cuentas' | 'section_header';
  summaryValue?: string;
  trendText?: string;
  sourceName?: string;
  tableName?: string;
  echartsOption?: echarts.EChartsOption;
  width: CardWidth;
  height?: number;
  badge?: string;
  customColor?: string;
  kpiIcon?: 'dollar' | 'orders' | 'ticket' | 'wallet';
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

const STORAGE_KEY = 'proyecto_bi_dashboard_cards_v6';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Content-Aware Limits: Prevent cards from shrinking below visual quality thresholds
interface ContentLimits {
  minWidth: CardWidth;
  minHeight: number;
  maxWidth: CardWidth;
  maxHeight: number;
}

const getContentLimits = (kind: GridCardItem['chartKind']): ContentLimits => {
  switch (kind) {
    case 'kpi':
      return { minWidth: 3, minHeight: 140, maxWidth: 6, maxHeight: 260 };
    case 'donut':
      return { minWidth: 3, minHeight: 240, maxWidth: 12, maxHeight: 650 };
    case 'bar_grouped':
      return { minWidth: 4, minHeight: 220, maxWidth: 12, maxHeight: 650 };
    case 'line':
      return { minWidth: 4, minHeight: 220, maxWidth: 12, maxHeight: 650 };
    case 'plan_cuentas':
      return { minWidth: 5, minHeight: 240, maxWidth: 12, maxHeight: 650 };
    case 'section_header':
      return { minWidth: 12, minHeight: 60, maxWidth: 12, maxHeight: 120 };
    default:
      return { minWidth: 3, minHeight: 180, maxWidth: 12, maxHeight: 650 };
  }
};

export function DashboardCanvas({
  initialDocument,
  dynamicCards,
  onNavigateToBuilder,
  isDarkMode,
}: DashboardCanvasProps) {
  const [doc] = useState<DashboardDocument>(initialDocument);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Drag-and-drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const lastSwapRef = useRef<{ a: string; b: string; time: number } | null>(null);

  const [expandedCard, setExpandedCard] = useState<GridCardItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const cardDomRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevCardRects = useRef<Map<string, DOMRect>>(new Map());

  // Direct pull resize state
  const [resizingCard, setResizingCard] = useState<{
    id: string;
    initialWidth: CardWidth;
    initialHeight: number;
    currentWidth: CardWidth;
    currentHeight: number;
    hitLimit?: boolean;
  } | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Base Chart Options
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

  // Initial Seed Cards with balanced executive layout
  const defaultCards: GridCardItem[] = useMemo(
    () => [
      {
        id: 'section-kpis',
        title: 'Métricas Ejecutivas & Conversión',
        subtitle: 'Monitoreo consolidado de ingresos, pedidos y liquidez en tiempo real',
        chartKind: 'section_header',
        width: 12,
      },
      {
        id: 'kpi-ingresos',
        title: 'Ingresos Totales',
        chartKind: 'kpi',
        summaryValue: '$12,490.00',
        trendText: '+18.4% vs mes anterior',
        width: 3,
        height: 160,
        badge: 'Meta Superada',
        kpiIcon: 'dollar',
      },
      {
        id: 'kpi-ordenes',
        title: 'Órdenes Completadas',
        chartKind: 'kpi',
        summaryValue: '148',
        trendText: '+9.2% de conversión',
        width: 3,
        height: 160,
        badge: 'Operativo',
        kpiIcon: 'orders',
      },
      {
        id: 'kpi-ticket',
        title: 'Ticket Promedio',
        chartKind: 'kpi',
        summaryValue: '$84.39',
        trendText: 'Promedio por cliente activo',
        width: 3,
        height: 160,
        kpiIcon: 'ticket',
      },
      {
        id: 'kpi-caja',
        title: 'Disponibilidad en Caja',
        chartKind: 'kpi',
        summaryValue: '$145,000.00',
        trendText: 'Cuenta 111 (Disponible)',
        width: 3,
        height: 160,
        badge: 'Métrica Clave',
        kpiIcon: 'wallet',
      },
      {
        id: 'section-graficas',
        title: 'Análisis Gráfico & Distribución Geográfica',
        subtitle: 'Desglose multidimensional de ventas y logística por canal',
        chartKind: 'section_header',
        width: 12,
      },
      {
        id: 'chart-ventas-categoria',
        title: 'Ventas por Categoría de Producto',
        subtitle: 'Calculado desde retail_demo.products & order_items',
        chartKind: 'bar_grouped',
        width: 8,
        height: 340,
      },
      {
        id: 'chart-distribucion-geo',
        title: 'Distribución Geográfica',
        subtitle: 'País de destino de envíos',
        chartKind: 'donut',
        width: 4,
        height: 340,
      },
      {
        id: 'table-plan-cuentas',
        title: 'Plan de Cuentas (Reporte Jerárquico)',
        subtitle: 'Estructura de balance con niveles 1 > 11 > 111',
        chartKind: 'plan_cuentas',
        width: 6,
        height: 340,
        badge: 'Pixel-Perfect',
      },
      {
        id: 'chart-tendencia-ingresos',
        title: 'Tendencia de Ingresos Semanal',
        subtitle: 'Evolución en tiempo real',
        chartKind: 'line',
        width: 6,
        height: 340,
      },
    ],
    [],
  );

  // Cards State
  const [cards, setCards] = useState<GridCardItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item: GridCardItem) => {
              const limits = getContentLimits(item.chartKind);
              return {
                ...item,
                width: Math.max(limits.minWidth, Math.min(limits.maxWidth, item.width || 6)) as CardWidth,
                height: Math.max(limits.minHeight, Math.min(limits.maxHeight, item.height || 320)),
              };
            });
          }
        }
      } catch {
        // Fallback
      }
    }
    return defaultCards;
  });

  // =========================================================================
  // FLIP ANIMATION ENGINE: Organic Layout Sliding Transitions
  // =========================================================================
  const snapshotPositions = () => {
    const map = new Map<string, DOMRect>();
    cardDomRefs.current.forEach((el, id) => {
      if (el) {
        map.set(id, el.getBoundingClientRect());
      }
    });
    prevCardRects.current = map;
  };

  useIsomorphicLayoutEffect(() => {
    if (prevCardRects.current.size === 0) return;

    cardDomRefs.current.forEach((el, id) => {
      if (!el) return;
      if (id === draggedCardId) return;

      const prev = prevCardRects.current.get(id);
      if (!prev) return;

      const current = el.getBoundingClientRect();
      const dx = prev.left - current.left;
      const dy = prev.top - current.top;

      if (dx !== 0 || dy !== 0) {
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        el.style.transition = 'none';

        requestAnimationFrame(() => {
          el.style.transition = 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
          el.style.transform = '';
        });
      }
    });

    prevCardRects.current.clear();
  }, [cards, draggedCardId]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // Ignore
    }
  }, [cards]);

  // Sync dynamic cards
  useEffect(() => {
    if (dynamicCards.length === 0) return;

    snapshotPositions();
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
            height: dc.chartKind === 'kpi' ? 160 : 340,
            badge: 'Personalizada',
          });
        }
      });

      return newItems.length > 0 ? [...newItems, ...prev] : prev;
    });
  }, [dynamicCards]);

  const handleAddSectionHeader = () => {
    snapshotPositions();
    const newHeader: GridCardItem = {
      id: `section-${Date.now()}`,
      title: 'Nuevo Encabezado de Sección',
      subtitle: 'Descripción personalizada del bloque de métricas',
      chartKind: 'section_header',
      width: 12,
    };
    setCards((prev) => [newHeader, ...prev]);
    setIsEditMode(true);
  };

  const updateCardWidth = (id: string, width: CardWidth) => {
    snapshotPositions();
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, width } : c)));
  };

  const updateCardField = (
    id: string,
    fields: Partial<Pick<GridCardItem, 'title' | 'subtitle' | 'badge'>>,
  ) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...fields } : c)),
    );
  };

  const deleteCardById = (id: string) => {
    snapshotPositions();
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    snapshotPositions();
    setCards((prev) => {
      const next = [...prev];
      const item = next[index];
      if (!item) return prev;
      next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  // =========================================================================
  // CONTENT-AWARE DIRECT RESIZE (SHRINK & EXPAND WITH ADAPTIVE LIMITS)
  // =========================================================================
  const startResizing = (
    e: React.MouseEvent,
    card: GridCardItem,
    mode: 'corner' | 'bottom' | 'right' = 'corner',
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const containerWidth =
      gridContainerRef.current?.getBoundingClientRect().width || 1200;
    const colWidth = containerWidth / 12;

    const limits = getContentLimits(card.chartKind);

    setResizingCard({
      id: card.id,
      initialWidth: card.width,
      initialHeight: card.height || 320,
      currentWidth: card.width,
      currentHeight: card.height || 320,
      hitLimit: false,
    });

    let rafId: number | null = null;
    let lastWidth = card.width;
    let lastHeight = card.height || 320;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = card.width;
        let newHeight = card.height || 320;
        let hit = false;

        if (mode === 'corner' || mode === 'right') {
          const colDelta = Math.round(deltaX / colWidth);
          const rawSpan = card.width + colDelta;
          
          if (rawSpan <= limits.minWidth) {
            newWidth = limits.minWidth;
            if (rawSpan < limits.minWidth) hit = true;
          } else if (rawSpan >= limits.maxWidth) {
            newWidth = limits.maxWidth;
            if (rawSpan > limits.maxWidth) hit = true;
          } else {
            newWidth = rawSpan as CardWidth;
          }
        }

        if (mode === 'corner' || mode === 'bottom') {
          const rawHeight = (card.height || 320) + deltaY;
          if (rawHeight <= limits.minHeight) {
            newHeight = limits.minHeight;
            if (rawHeight < limits.minHeight) hit = true;
          } else if (rawHeight >= limits.maxHeight) {
            newHeight = limits.maxHeight;
            if (rawHeight > limits.maxHeight) hit = true;
          } else {
            newHeight = rawHeight;
          }
        }

        if (newWidth !== lastWidth || Math.abs(newHeight - lastHeight) >= 3 || hit !== resizingCard?.hitLimit) {
          if (newWidth !== lastWidth) {
            snapshotPositions();
          }
          lastWidth = newWidth;
          lastHeight = newHeight;

          setCards((prev) =>
            prev.map((c) =>
              c.id === card.id ? { ...c, width: newWidth, height: newHeight } : c,
            ),
          );

          setResizingCard({
            id: card.id,
            initialWidth: card.width,
            initialHeight: card.height || 320,
            currentWidth: newWidth,
            currentHeight: newHeight,
            hitLimit: hit,
          });
        }
      });
    };

    const onMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setResizingCard(null);
    };

    const cursor =
      mode === 'corner'
        ? 'se-resize'
        : mode === 'bottom'
        ? 'ns-resize'
        : 'ew-resize';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // =========================================================================
  // DYNAMIC SWAP REORGANIZATION: 100% Fluid, Anti-PingPong Lock
  // =========================================================================
  const handleDragStart = (id: string, e: React.DragEvent) => {
    setDraggedCardId(id);
    lastSwapRef.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedCardId || draggedCardId === targetId) return;

    const now = Date.now();
    // Anti-oscillation lock: prevent immediate reverse swap between the same two cards
    if (
      lastSwapRef.current &&
      ((lastSwapRef.current.a === draggedCardId && lastSwapRef.current.b === targetId) ||
       (lastSwapRef.current.a === targetId && lastSwapRef.current.b === draggedCardId)) &&
      now - lastSwapRef.current.time < 350
    ) {
      return;
    }

    lastSwapRef.current = { a: draggedCardId, b: targetId, time: now };
    snapshotPositions();

    setCards((prev) => {
      const fromIdx = prev.findIndex((c) => c.id === draggedCardId);
      const toIdx = prev.findIndex((c) => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      if (moved) next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const handleDragEnd = () => {
    setDraggedCardId(null);
    lastSwapRef.current = null;
  };

  const getColSpanClass = (w: CardWidth): string => {
    switch (w) {
      case 3:
        return 'col-span-12 sm:col-span-6 lg:col-span-3';
      case 4:
        return 'col-span-12 sm:col-span-6 lg:col-span-4';
      case 5:
        return 'col-span-12 lg:col-span-5';
      case 6:
        return 'col-span-12 lg:col-span-6';
      case 7:
        return 'col-span-12 lg:col-span-7';
      case 8:
        return 'col-span-12 lg:col-span-8';
      case 9:
        return 'col-span-12 lg:col-span-9';
      case 10:
        return 'col-span-12 lg:col-span-10';
      case 11:
        return 'col-span-12 lg:col-span-11';
      case 12:
      default:
        return 'col-span-12';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full space-y-6 bg-background">
      {/* Top Action Bar (Clean Executive Metabase Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{doc.title}</h1>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success flex items-center gap-1.5 border border-success/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Tiempo Real (SSE)
            </span>
            {isEditMode && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary flex items-center gap-1.5 border border-primary/20 animate-pulse">
                <Sparkles className="h-3.5 w-3.5" />
                Modo Edición Activo
              </span>
            )}
          </div>
          <p className="text-sm text-muted mt-0.5">{doc.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dashboard Period Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs text-muted shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-foreground">Este trimestre</span>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>

          <button
            onClick={handleAddSectionHeader}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-sm"
            title="Añadir divisor de sección"
          >
            <Heading className="h-3.5 w-3.5 text-primary" />
            <span>+ Encabezado</span>
          </button>

          {/* Toggle Edit Mode Button */}
          <button
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setEditingCardId(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              isEditMode
                ? 'border-primary bg-primary text-white shadow-primary/20'
                : 'border-surface-border bg-surface text-foreground hover:bg-surface-subtle'
            }`}
          >
            {isEditMode ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
            <span>{isEditMode ? 'Terminar Edición' : 'Personalizar Tablero'}</span>
          </button>

          <button
            onClick={onNavigateToBuilder}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ Añadir Pregunta</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface border border-surface-border text-foreground text-xs font-semibold hover:bg-surface-subtle transition-all shadow-sm"
            title="Compartir o exportar tablero"
          >
            <Share2 className="h-3.5 w-3.5 text-muted" />
            <span>Compartir</span>
          </button>
        </div>
      </div>

      {/* Unified 12-Column Flexible Grid */}
      <div
        ref={gridContainerRef}
        className="grid grid-cols-12 gap-5 w-full relative"
      >
        {cards.map((card, idx) => {
          const colSpanClass = getColSpanClass(card.width);
          const isBeingDragged = draggedCardId === card.id;
          const isBeingResized = resizingCard?.id === card.id;
          const isEditingThisCard = editingCardId === card.id;
          const limits = getContentLimits(card.chartKind);

          // =====================================================
          // 1. ARCHITECTURAL SECTION HEADER (Clean, Defined Divider)
          // =====================================================
          if (card.chartKind === 'section_header') {
            return (
              <div
                key={card.id}
                ref={(el) => {
                  if (el) cardDomRefs.current.set(card.id, el);
                  else cardDomRefs.current.delete(card.id);
                }}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(card.id, e)}
                onDragOver={(e) => handleDragOver(e, card.id)}
                onDragEnd={handleDragEnd}
                className={`${colSpanClass} min-w-0 rounded-2xl bg-surface border border-slate-300 dark:border-slate-700/80 px-5 py-3.5 shadow-sm transition-all duration-300 relative group ${
                  isBeingDragged ? 'opacity-40 scale-[0.99] border-dashed border-primary' : ''
                }`}
                style={{
                  borderLeftWidth: '5px',
                  borderLeftColor: 'hsl(var(--primary))',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isEditMode && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-surface-subtle text-muted hover:text-foreground shrink-0 transition-transform active:scale-95"
                        title="Arrastrar sección"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {isEditMode ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) =>
                              updateCardField(card.id, { title: e.target.value })
                            }
                            placeholder="Título de la sección..."
                            className="w-full px-2 py-0.5 rounded-lg border border-surface-border bg-surface text-base font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            value={card.subtitle || ''}
                            onChange={(e) =>
                              updateCardField(card.id, { subtitle: e.target.value })
                            }
                            placeholder="Descripción (opcional)..."
                            className="w-full px-2 py-0.5 rounded-lg border border-surface-border bg-surface text-xs text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-base font-bold text-foreground tracking-tight">
                            {card.title}
                          </h2>
                          {card.subtitle && (
                            <p className="text-xs text-muted mt-0.5">{card.subtitle}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditMode && (
                    <div className="flex items-center gap-1 shrink-0 bg-surface-subtle p-0.5 rounded-lg border border-surface-border">
                      <button
                        onClick={() => moveCard(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                        title="Mover arriba"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveCard(idx, 'down')}
                        disabled={idx === cards.length - 1}
                        className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                        title="Mover abajo"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCardById(card.id)}
                        className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 ml-0.5"
                        title="Eliminar sección"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // =====================================================
          // 2. EXECUTIVE BUSINESS INTELLIGENCE CARDS (Clean Framing Lines)
          // =====================================================
          return (
            <div
              key={card.id}
              ref={(el) => {
                if (el) cardDomRefs.current.set(card.id, el);
                else cardDomRefs.current.delete(card.id);
              }}
              draggable={isEditMode && !resizingCard}
              onDragStart={(e) => handleDragStart(card.id, e)}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDragEnd={handleDragEnd}
              className={`${colSpanClass} min-w-0 rounded-2xl bg-surface p-5 flex flex-col justify-between relative group border border-slate-300/80 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 ${
                isBeingDragged
                  ? 'opacity-30 scale-[0.98] border-dashed border-primary shadow-inner bg-primary/5'
                  : isBeingResized
                  ? 'ring-2 ring-primary ring-offset-2 shadow-2xl z-20 border-primary'
                  : ''
              }`}
              style={{
                height: card.height ? `${card.height}px` : undefined,
                minHeight: `${limits.minHeight}px`,
              }}
            >
              {/* Dimension Tooltip when actively resizing */}
              {isBeingResized && (
                <div
                  className={`absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 pointer-events-none animate-in fade-in ${
                    resizingCard?.hitLimit
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-foreground text-background'
                  }`}
                >
                  <span>📐 {card.width} columnas ({Math.round((card.width / 12) * 100)}%)</span>
                  <span>•</span>
                  <span>{card.height}px</span>
                  {resizingCard?.hitLimit && (
                    <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded-full ml-1">Límite óptimo</span>
                  )}
                </div>
              )}

              {/* Card Header (Structured with crisp division line) */}
              <div className="mb-2.5 pb-2 border-b border-surface-border/70 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Drag Handle in Edit Mode */}
                    {isEditMode && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-subtle text-muted hover:text-foreground shrink-0 transition-transform active:scale-95"
                        title="Arrastrar para reordenar de forma fluida"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {isEditMode && isEditingThisCard ? (
                        <div className="space-y-1 py-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) =>
                                updateCardField(card.id, { title: e.target.value })
                              }
                              placeholder="Título de la tarjeta..."
                              className="flex-1 px-2 py-0.5 rounded border border-surface-border bg-surface text-sm font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                            <button
                              onClick={() => setEditingCardId(null)}
                              className="p-1 rounded text-muted hover:text-foreground"
                              title="Listo"
                            >
                              <Check className="h-3.5 w-3.5 text-success" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={card.subtitle || ''}
                              onChange={(e) =>
                                updateCardField(card.id, { subtitle: e.target.value })
                              }
                              placeholder="Subtítulo..."
                              className="flex-1 px-2 py-0.5 rounded border border-surface-border bg-surface text-[11px] text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                            <input
                              type="text"
                              value={card.badge || ''}
                              onChange={(e) =>
                                updateCardField(card.id, { badge: e.target.value })
                              }
                              placeholder="Badge..."
                              className="w-20 px-2 py-0.5 rounded border border-surface-border bg-surface text-[10px] text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                            {card.title}
                          </h3>
                          {card.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-subtle text-foreground border border-surface-border shrink-0">
                              {card.badge}
                            </span>
                          )}
                          {isEditMode && (
                            <button
                              onClick={() => setEditingCardId(card.id)}
                              className="p-1 rounded text-muted hover:text-foreground opacity-60 hover:opacity-100 transition-opacity"
                              title="Editar título y etiquetas"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                      {!isEditingThisCard && card.subtitle && (
                        <p className="text-[11px] text-muted mt-0.5 truncate">{card.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Header Toolbar */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Micro-Icon for KPI cards */}
                    {card.chartKind === 'kpi' && !isEditMode && (
                      <div className="p-1.5 rounded-xl bg-surface-subtle border border-surface-border text-foreground/80">
                        {card.kpiIcon === 'dollar' && <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                        {card.kpiIcon === 'orders' && <ShoppingBag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                        {card.kpiIcon === 'ticket' && <CreditCard className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                        {card.kpiIcon === 'wallet' && <Wallet className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />}
                        {!card.kpiIcon && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    )}

                    {/* Quick Width Buttons in Edit Mode */}
                    {isEditMode && (
                      <div className="hidden sm:flex items-center gap-0.5 mr-1 bg-surface-subtle px-1 py-0.5 rounded-lg border border-surface-border text-[10px]">
                        {[
                          { w: 3 as CardWidth, label: '1/4' },
                          { w: 4 as CardWidth, label: '1/3' },
                          { w: 6 as CardWidth, label: '1/2' },
                          { w: 8 as CardWidth, label: '2/3' },
                          { w: 12 as CardWidth, label: 'Full' },
                        ].map((btn) => (
                          <button
                            key={btn.w}
                            disabled={btn.w < limits.minWidth}
                            onClick={() => updateCardWidth(card.id, btn.w)}
                            className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                              card.width === btn.w
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-muted hover:text-foreground disabled:opacity-20'
                            }`}
                            title={`Ajustar a ancho ${btn.label}`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Up / Down / Delete in Edit Mode */}
                    {isEditMode && (
                      <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-surface-border">
                        <button
                          onClick={() => moveCard(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                          title="Mover arriba"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveCard(idx, 'down')}
                          disabled={idx === cards.length - 1}
                          className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                          title="Mover abajo"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteCardById(card.id)}
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 ml-0.5"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedCard(card)}
                      className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface-subtle transition-all"
                      title="Expandir a pantalla completa"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Body (100% Focused on Content & Visuals) */}
              <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                {card.chartKind === 'kpi' && (
                  <div className="py-2 space-y-2">
                    <div className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
                      {card.summaryValue}
                    </div>
                    {card.trendText && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
                    height={card.height ? Math.max(160, card.height - 75) : 280}
                  />
                )}

                {card.chartKind === 'donut' && (
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={card.echartsOption || defaultDonutOption}
                    height={card.height ? Math.max(160, card.height - 75) : 280}
                  />
                )}

                {card.chartKind === 'line' && (
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={card.echartsOption || defaultLineOption}
                    height={card.height ? Math.max(160, card.height - 75) : 260}
                  />
                )}

                {card.chartKind === 'plan_cuentas' && (
                  <div
                    className="overflow-auto rounded-xl border border-surface-border h-full"
                    style={{
                      maxHeight: card.height ? `${card.height - 75}px` : undefined,
                    }}
                  >
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-surface-border text-foreground font-semibold bg-surface-subtle sticky top-0 z-10">
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

              {/* Direct Resize Corner Handle (Pull like an image) */}
              <div
                onMouseDown={(e) => startResizing(e, card, 'corner')}
                className="absolute bottom-1 right-1 h-5 w-5 cursor-se-resize flex items-end justify-end p-1 text-muted/40 hover:text-primary transition-all z-20 group-hover:opacity-100 opacity-40 hover:scale-125"
                title="Arrastrá para redimensionar (se ajusta al contenido)"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="9" y1="2" x2="2" y2="9" />
                  <line x1="9" y1="6" x2="6" y2="9" />
                </svg>
              </div>

              {/* Edge Handles */}
              <div
                onMouseDown={(e) => startResizing(e, card, 'right')}
                className="absolute top-6 bottom-6 right-0 w-2 cursor-ew-resize hover:bg-primary/20 transition-colors z-10"
                title="Arrastrá para ancho"
              />

              <div
                onMouseDown={(e) => startResizing(e, card, 'bottom')}
                className="absolute bottom-0 left-6 right-6 h-2 cursor-ns-resize hover:bg-primary/20 transition-colors z-10"
                title="Arrastrá para alto"
              />
            </div>
          );
        })}
      </div>

      {/* Card Expand Fullscreen Modal */}
      <CardExpandModal
        card={expandedCard}
        isOpen={Boolean(expandedCard)}
        onClose={() => setExpandedCard(null)}
        isDarkMode={isDarkMode}
      />

      {/* Share Dashboard Modal */}
      <ShareDashboardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        dashboardTitle={doc.title}
        cards={cards}
      />
    </div>
  );
}
