'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  Edit3,
  GripVertical,
  Heading,
  Maximize2,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
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
  height?: number; // Custom height in pixels
  customColor?: string; // Hex color code
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

const STORAGE_KEY = 'proyecto_bi_dashboard_cards_v3';

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
  const [expandedCard, setExpandedCard] = useState<GridCardItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeColorPickerCardId, setActiveColorPickerCardId] = useState<string | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Resize State for direct manipulation (pulling corners/edges)
  const [resizingCard, setResizingCard] = useState<{
    id: string;
    initialWidth: CardWidth;
    initialHeight: number;
    currentWidth: CardWidth;
    currentHeight: number;
  } | null>(null);

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

  // Initial Seed Cards
  const defaultCards: GridCardItem[] = useMemo(
    () => [
      {
        id: 'section-kpis',
        title: 'Métricas Ejecutivas & Conversión',
        subtitle: 'Monitoreo consolidado de ingresos, pedidos y liquidez en tiempo real',
        chartKind: 'section_header',
        width: 12,
        customColor: '#2563eb',
      },
      {
        id: 'kpi-ingresos',
        title: 'Ingresos Totales',
        chartKind: 'kpi',
        summaryValue: '$12,490.00',
        trendText: '+18.4% vs mes anterior',
        width: 3,
        height: 220,
        customColor: '#059669',
        badge: 'Meta Superada',
      },
      {
        id: 'kpi-ordenes',
        title: 'Órdenes Completadas',
        chartKind: 'kpi',
        summaryValue: '148',
        trendText: '+9.2% de conversión',
        width: 3,
        height: 220,
        customColor: '#2563eb',
        badge: 'Operativo',
      },
      {
        id: 'kpi-ticket',
        title: 'Ticket Promedio',
        chartKind: 'kpi',
        summaryValue: '$84.39',
        trendText: 'Promedio por cliente activo',
        width: 3,
        height: 220,
        customColor: '#7c3aed',
      },
      {
        id: 'kpi-caja',
        title: 'Disponibilidad en Caja',
        chartKind: 'kpi',
        summaryValue: '$145,000.00',
        trendText: 'Cuenta 111 (Disponible)',
        width: 3,
        height: 220,
        customColor: '#d97706',
        badge: 'Métrica Clave',
      },
      {
        id: 'section-graficas',
        title: 'Análisis Gráfico & Distribución Geográfica',
        subtitle: 'Desglose multidimensional de ventas y logística por canal',
        chartKind: 'section_header',
        width: 12,
        customColor: '#0891b2',
      },
      {
        id: 'chart-ventas-categoria',
        title: 'Ventas por Categoría de Producto',
        subtitle: 'Calculado desde retail_demo.products & order_items',
        chartKind: 'bar_grouped',
        width: 8,
        height: 360,
        customColor: '#2563eb',
      },
      {
        id: 'chart-distribucion-geo',
        title: 'Distribución Geográfica',
        subtitle: 'País de destino de envíos',
        chartKind: 'donut',
        width: 4,
        height: 360,
        customColor: '#db2777',
      },
      {
        id: 'table-plan-cuentas',
        title: 'Plan de Cuentas (Reporte Jerárquico)',
        subtitle: 'Estructura de balance con niveles 1 > 11 > 111',
        chartKind: 'plan_cuentas',
        width: 6,
        height: 380,
        customColor: '#2563eb',
        badge: 'Pixel-Perfect',
      },
      {
        id: 'chart-tendencia-ingresos',
        title: 'Tendencia de Ingresos Semanal',
        subtitle: 'Evolución en tiempo real',
        chartKind: 'line',
        width: 6,
        height: 380,
        customColor: '#7c3aed',
      },
    ],
    [],
  );

  // Cards State (Initialized with localStorage if present, sanitized with minimum width 3)
  const [cards, setCards] = useState<GridCardItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item: GridCardItem) => ({
              ...item,
              width: Math.max(3, Math.min(12, item.width || 6)) as CardWidth,
              height: Math.max(180, item.height || 320),
            }));
          }
        }
      } catch {
        // Fallback to default
      }
    }
    return defaultCards;
  });

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // Storage full or private mode
    }
  }, [cards]);

  // Synchronize incoming dynamic cards created by user from Visual Builder
  useEffect(() => {
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
            height: dc.chartKind === 'kpi' ? 220 : 360,
            customColor: dc.chartKind === 'kpi' ? '#059669' : '#2563eb',
            badge: 'Personalizada',
          });
        }
      });

      return newItems.length > 0 ? [...newItems, ...prev] : prev;
    });
  }, [dynamicCards]);

  // Add a new Custom Section Header
  const handleAddSectionHeader = () => {
    const newHeader: GridCardItem = {
      id: `section-${Date.now()}`,
      title: 'Nuevo Encabezado de Sección',
      subtitle: 'Descripción personalizada del bloque de métricas',
      chartKind: 'section_header',
      width: 12,
      customColor: '#2563eb',
    };
    setCards((prev) => [newHeader, ...prev]);
    setIsEditMode(true);
  };

  // Card Mutators
  const updateCardColor = (id: string, customColor: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, customColor } : c)),
    );
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

  // ==========================================
  // DIRECT MANIPULATION: Drag to Resize (Pull like an image)
  // ==========================================
  const startResizing = (
    e: React.MouseEvent,
    cardId: string,
    initialWidth: CardWidth,
    initialHeight: number,
    mode: 'corner' | 'bottom' | 'right' = 'corner',
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const containerWidth =
      gridContainerRef.current?.getBoundingClientRect().width || 1200;
    const colWidth = containerWidth / 12;

    setResizingCard({
      id: cardId,
      initialWidth,
      initialHeight,
      currentWidth: initialWidth,
      currentHeight: initialHeight,
    });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = initialWidth;
      let newHeight = initialHeight;

      if (mode === 'corner' || mode === 'right') {
        const colDelta = Math.round(deltaX / colWidth);
        const rawSpan = initialWidth + colDelta;
        // Clamp width between 3 (25%) and 12 (100%)
        newWidth = Math.max(3, Math.min(12, rawSpan)) as CardWidth;
      }

      if (mode === 'corner' || mode === 'bottom') {
        // Clamp height between 180px and 800px
        newHeight = Math.max(180, Math.min(800, initialHeight + deltaY));
      }

      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, width: newWidth, height: newHeight } : c,
        ),
      );

      setResizingCard({
        id: cardId,
        initialWidth,
        initialHeight,
        currentWidth: newWidth,
        currentHeight: newHeight,
      });
    };

    const onMouseUp = () => {
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

  // ==========================================
  // DYNAMIC DRAG & DROP: Real-Time Instant Swap
  // ==========================================
  const handleDragStart = (id: string, e: React.DragEvent) => {
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedCardId || draggedCardId === targetId) return;

    // Real-Time Swap: Cards immediately shift to the other side as you drag over!
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
  };

  // Helper class generators for width (12-column responsive grid)
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

  // Curated color quick presets
  const colorPresets = [
    { label: 'Azul', value: '#2563eb' },
    { label: 'Esmeralda', value: '#059669' },
    { label: 'Ámbar', value: '#d97706' },
    { label: 'Púrpura', value: '#7c3aed' },
    { label: 'Rosa', value: '#db2777' },
    { label: 'Cian', value: '#0891b2' },
    { label: 'Naranja', value: '#ea580c' },
    { label: 'Gris', value: '#64748b' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 w-full space-y-6 bg-background">
      {/* Top Action Bar */}
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

          {/* Add Section Header Button */}
          <button
            onClick={handleAddSectionHeader}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-sm"
            title="Añadir separador o encabezado de sección"
          >
            <Heading className="h-3.5 w-3.5 text-primary" />
            <span>+ Encabezado</span>
          </button>

          {/* Toggle Edit / Layout Mode Button */}
          <button
            onClick={() => {
              setIsEditMode((prev) => !prev);
              setActiveColorPickerCardId(null);
            }}
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

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface border border-surface-border text-foreground text-xs font-semibold hover:bg-surface-subtle transition-all shadow-sm"
            title="Compartir enlace o incrustar tablero"
          >
            <Share2 className="h-3.5 w-3.5 text-muted" />
            <span>Compartir</span>
          </button>
        </div>
      </div>

      {/* Edit Mode Instruction Banner */}
      {isEditMode && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold shrink-0 shadow-sm">
              <GripVertical className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Modo de Redimensionamiento y Reorganización Directa</span>
              <span className="text-muted block text-xs mt-0.5">
                • <strong>Redimensionar:</strong> Jalá la esquina inferior derecha ⤡ o los bordes de cualquier tarjeta como una imagen.
                • <strong>Reorganizar:</strong> Arrastrá desde el asa ⠿ y verás cómo las demás tarjetas se desplazan dinámicamente en tiempo real.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddSectionHeader}
              className="px-3 py-1.5 rounded-lg border border-primary/30 bg-surface text-primary font-bold hover:bg-primary/10 shrink-0 text-xs"
            >
              + Añadir Sección
            </button>
            <button
              onClick={() => {
                setIsEditMode(false);
                setActiveColorPickerCardId(null);
              }}
              className="px-4 py-1.5 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover shrink-0 shadow-sm text-xs"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Unified 12-Column Flexible Grid with Fluid Transitions */}
      <div
        ref={gridContainerRef}
        className="grid grid-cols-12 gap-5 w-full relative"
      >
        {cards.map((card, idx) => {
          const colSpanClass = getColSpanClass(card.width);
          const isBeingDragged = draggedCardId === card.id;
          const isBeingResized = resizingCard?.id === card.id;

          // Render Section Header Card
          if (card.chartKind === 'section_header') {
            return (
              <div
                key={card.id}
                draggable={isEditMode}
                onDragStart={(e) => handleDragStart(card.id, e)}
                onDragOver={(e) => handleDragOver(e, card.id)}
                onDragEnd={handleDragEnd}
                className={`${colSpanClass} rounded-2xl bg-surface/80 border p-4 transition-all duration-300 relative ${
                  isBeingDragged
                    ? 'opacity-40 scale-[0.98] border-dashed border-primary shadow-inner'
                    : 'border-surface-border'
                }`}
                style={
                  card.customColor
                    ? { borderLeftWidth: '6px', borderLeftColor: card.customColor }
                    : undefined
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {isEditMode && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1.5 rounded hover:bg-surface-subtle text-muted hover:text-foreground shrink-0"
                        title="Arrastrar sección para mover"
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      {isEditMode ? (
                        <div className="space-y-1 w-full">
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) =>
                              updateCardField(card.id, { title: e.target.value })
                            }
                            placeholder="Título de la sección..."
                            className="w-full px-2.5 py-1 rounded-lg border border-surface-border bg-surface text-base font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            value={card.subtitle || ''}
                            onChange={(e) =>
                              updateCardField(card.id, { subtitle: e.target.value })
                            }
                            placeholder="Descripción o subtítulo de la sección..."
                            className="w-full px-2.5 py-0.5 rounded-lg border border-surface-border bg-surface text-xs text-muted focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <h2 className="text-lg font-bold text-foreground tracking-tight">
                            {card.title}
                          </h2>
                          {card.subtitle && (
                            <p className="text-xs text-muted mt-0.5">{card.subtitle}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Controls for Section Header */}
                  {isEditMode && (
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Color Picker */}
                      <label
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted cursor-pointer px-2.5 py-1.5 rounded-xl border border-surface-border bg-surface hover:bg-surface-subtle shadow-sm"
                        title="Elegir color de la sección"
                      >
                        <input
                          type="color"
                          value={card.customColor || '#2563eb'}
                          onChange={(e) => updateCardColor(card.id, e.target.value)}
                          className="h-4 w-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                        />
                        <span>Color</span>
                      </label>

                      <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border shadow-sm">
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
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors ml-1"
                          title="Eliminar sección"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // Render Normal Dashboard Card (KPI, Chart, Table)
          const isColorPickerOpen = activeColorPickerCardId === card.id;

          return (
            <div
              key={card.id}
              draggable={isEditMode && !resizingCard}
              onDragStart={(e) => handleDragStart(card.id, e)}
              onDragOver={(e) => handleDragOver(e, card.id)}
              onDragEnd={handleDragEnd}
              className={`${colSpanClass} rounded-2xl bg-surface p-5 flex flex-col justify-between transition-all duration-300 relative group border ${
                isBeingDragged
                  ? 'opacity-40 scale-[0.98] border-dashed border-primary shadow-inner'
                  : isBeingResized
                  ? 'ring-2 ring-primary ring-offset-2 shadow-2xl border-primary'
                  : 'border-surface-border shadow-sm hover:border-primary/40'
              }`}
              style={{
                borderColor: card.customColor || undefined,
                boxShadow: card.customColor
                  ? `0 4px 20px ${card.customColor}20`
                  : undefined,
                height: card.height ? `${card.height}px` : undefined,
                minHeight: '200px',
              }}
            >
              {/* Highlight Top Accent Bar */}
              {card.customColor && (
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                  style={{ backgroundColor: card.customColor }}
                />
              )}

              {/* Dimension Tooltip when actively resizing */}
              {isBeingResized && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-foreground text-background text-xs font-bold shadow-xl flex items-center gap-1.5 pointer-events-none animate-in fade-in">
                  <span>📐 {card.width} columnas ({Math.round((card.width / 12) * 100)}%)</span>
                  <span>•</span>
                  <span>{card.height}px</span>
                </div>
              )}

              {/* Card Header */}
              <div className="mb-2 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {/* Drag Handle in Edit Mode */}
                    {isEditMode && (
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-surface-subtle text-muted hover:text-foreground shrink-0 mt-0.5"
                        title="Arrastrar para reorganizar (se desplaza en tiempo real)"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {isEditMode ? (
                        <div className="space-y-1 w-full">
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) =>
                              updateCardField(card.id, { title: e.target.value })
                            }
                            placeholder="Título..."
                            className="w-full px-2 py-0.5 rounded border border-surface-border bg-surface text-sm font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                          />
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
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
                              {card.title}
                            </h3>
                            {card.badge && (
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                                style={
                                  card.customColor
                                    ? {
                                        backgroundColor: `${card.customColor}15`,
                                        color: card.customColor,
                                        border: `1px solid ${card.customColor}40`,
                                      }
                                    : undefined
                                }
                              >
                                {card.badge}
                              </span>
                            )}
                          </div>
                          {card.subtitle && (
                            <p className="text-[11px] text-muted mt-0.5 truncate">{card.subtitle}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Header Toolbar */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Color Swatch Menu in Edit Mode */}
                    {isEditMode && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveColorPickerCardId(isColorPickerOpen ? null : card.id)
                          }
                          className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle transition-all"
                          title="Cambiar color de acento"
                        >
                          <div
                            className="h-3.5 w-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: card.customColor || '#2563eb' }}
                          />
                        </button>

                        {/* Floating Color Menu Dropdown */}
                        {isColorPickerOpen && (
                          <div className="absolute right-0 top-8 z-30 p-2.5 rounded-2xl bg-surface border border-surface-border shadow-2xl w-48 space-y-2 animate-in fade-in">
                            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                              Color de Acento
                            </span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {colorPresets.map((hl) => (
                                <button
                                  key={hl.value}
                                  onClick={() => {
                                    updateCardColor(card.id, hl.value);
                                    setActiveColorPickerCardId(null);
                                  }}
                                  title={hl.label}
                                  className="h-6 w-6 rounded-lg transition-transform hover:scale-110 flex items-center justify-center border border-surface-border shadow-sm"
                                  style={{ backgroundColor: hl.value }}
                                >
                                  {card.customColor === hl.value && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </button>
                              ))}
                            </div>
                            <div className="pt-1.5 border-t border-surface-border flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-muted">Paleta Libre:</span>
                              <input
                                type="color"
                                value={card.customColor || '#2563eb'}
                                onChange={(e) => updateCardColor(card.id, e.target.value)}
                                className="h-5 w-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Up / Down / Delete in Edit Mode */}
                    {isEditMode && (
                      <div className="flex items-center gap-0.5 bg-surface-subtle p-0.5 rounded-lg border border-surface-border">
                        <button
                          onClick={() => moveCard(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                          title="Mover antes"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveCard(idx, 'down')}
                          disabled={idx === cards.length - 1}
                          className="p-1 rounded text-muted hover:text-foreground disabled:opacity-30"
                          title="Mover después"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteCardById(card.id)}
                          className="p-1 rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Functional Expand Button */}
                    <button
                      onClick={() => setExpandedCard(card)}
                      className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-surface-subtle transition-all"
                      title="Expandir a pantalla completa"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Body Renderers (Responsive to dynamic height) */}
              <div className="flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
                {card.chartKind === 'kpi' && (
                  <div className="py-2 space-y-1">
                    <div className="text-3xl font-black text-foreground tracking-tight font-mono">
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
                    height={card.height ? Math.max(160, card.height - 85) : 280}
                  />
                )}

                {card.chartKind === 'donut' && (
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={card.echartsOption || defaultDonutOption}
                    height={card.height ? Math.max(160, card.height - 85) : 280}
                  />
                )}

                {card.chartKind === 'line' && (
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={card.echartsOption || defaultLineOption}
                    height={card.height ? Math.max(160, card.height - 85) : 260}
                  />
                )}

                {card.chartKind === 'plan_cuentas' && (
                  <div
                    className="overflow-auto rounded-xl border border-surface-border h-full"
                    style={{
                      maxHeight: card.height ? `${card.height - 85}px` : undefined,
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

              {/* ======================================================= */}
              {/* DIRECT MANIPULATION RESIZE HANDLES (PULL LIKE AN IMAGE) */}
              {/* ======================================================= */}
              {/* Bottom-Right Corner Handle (Dual Horizontal & Vertical) */}
              <div
                onMouseDown={(e) =>
                  startResizing(e, card.id, card.width, card.height || 320, 'corner')
                }
                className="absolute bottom-1 right-1 h-6 w-6 cursor-se-resize flex items-end justify-end p-1 text-muted hover:text-primary transition-all z-20 group-hover:opacity-100 opacity-60 hover:scale-125"
                title="Arrastrá para redimensionar ancho y alto (como una imagen)"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="11" y1="3" x2="3" y2="11" />
                  <line x1="11" y1="7" x2="7" y2="11" />
                  <line x1="11" y1="11" x2="11" y2="11" />
                </svg>
              </div>

              {/* Right Edge Handle (Horizontal Width Only) */}
              <div
                onMouseDown={(e) =>
                  startResizing(e, card.id, card.width, card.height || 320, 'right')
                }
                className="absolute top-8 bottom-8 right-0 w-2 cursor-ew-resize hover:bg-primary/30 transition-colors z-10"
                title="Arrastrá horizontalmente para cambiar ancho de columnas"
              />

              {/* Bottom Edge Handle (Vertical Height Only) */}
              <div
                onMouseDown={(e) =>
                  startResizing(e, card.id, card.width, card.height || 320, 'bottom')
                }
                className="absolute bottom-0 left-8 right-8 h-2 cursor-ns-resize hover:bg-primary/30 transition-colors z-10"
                title="Arrastrá verticalmente para cambiar la altura"
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
