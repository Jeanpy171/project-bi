'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardCard } from '@bi/contracts';
import {
  AlignLeft,
  BarChart3,
  Check,
  Filter,
  Gauge,
  LineChart,
  PieChart,
  Sparkles,
  Table as TableIcon,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

export interface ChartCatalogItem {
  readonly id: DashboardCard['chartKind'];
  readonly title: string;
  readonly category: 'tendencia' | 'comparacion' | 'metas' | 'composicion';
  readonly categoryLabel: string;
  readonly description: string;
  readonly dataReq: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly badge?: string;
}

export const CHART_CATALOG: readonly ChartCatalogItem[] = [
  // 1. Tendencia & Evolución
  {
    id: 'line',
    title: 'Línea de Tendencia (Spline)',
    category: 'tendencia',
    categoryLabel: 'Tendencia & Evolución',
    description: 'Visualiza la evolución temporal de ventas, ingresos o métricas continuas.',
    dataReq: '1 Dimensión Temporal • 1 Métrica',
    icon: TrendingUp,
    badge: 'Popular',
  },
  {
    id: 'area',
    title: 'Área con Gradiente Luminoso',
    category: 'tendencia',
    categoryLabel: 'Tendencia & Evolución',
    description: 'Destaca el volumen acumulado y flujo con relleno translúcido degradado.',
    dataReq: '1 Dimensión Temporal • 1 Métrica',
    icon: LineChart,
    badge: 'Nuevo',
  },

  // 2. Comparación & Ranking
  {
    id: 'bar_grouped',
    title: 'Barras Verticales Agrupadas',
    category: 'comparacion',
    categoryLabel: 'Comparación & Ranking',
    description: 'Compara magnitudes entre categorías independientes con barras redondeadas.',
    dataReq: '1 Dimensión • 1 Métrica',
    icon: BarChart3,
  },
  {
    id: 'bar_horizontal',
    title: 'Barras Horizontales (Ranking)',
    category: 'comparacion',
    categoryLabel: 'Comparación & Ranking',
    description: 'Ideal para rankings de productos o clientes sin cortar nombres largos.',
    dataReq: '1 Dimensión • 1 Métrica',
    icon: AlignLeft,
    badge: 'Nuevo',
  },

  // 3. Metas & Conversión
  {
    id: 'gauge',
    title: 'Tacómetro Radial de Meta (Gauge)',
    category: 'metas',
    categoryLabel: 'Metas & Conversión',
    description: 'Muestra el porcentaje de cumplimiento alcanzado respecto a un objetivo comercial.',
    dataReq: '1 Métrica Actual • 1 Objetivo',
    icon: Gauge,
    badge: 'Nuevo',
  },
  {
    id: 'funnel',
    title: 'Embudo de Conversión (Funnel)',
    category: 'metas',
    categoryLabel: 'Metas & Conversión',
    description: 'Analiza la retención de usuarios y puntos de fuga en procesos de venta.',
    dataReq: '1 Etapa • 1 Métrica',
    icon: Filter,
    badge: 'Nuevo',
  },

  // 4. Composición & Resumen
  {
    id: 'donut',
    title: 'Donut / Anillo Moderno',
    category: 'composicion',
    categoryLabel: 'Composición & Resumen',
    description: 'Muestra la cuota de participación proporcional de cada segmento.',
    dataReq: '1 Dimensión • 1 Métrica',
    icon: PieChart,
  },
  {
    id: 'kpi',
    title: 'Tarjeta de KPI Ejecutivo',
    category: 'composicion',
    categoryLabel: 'Composición & Resumen',
    description: 'Cifra de alto impacto con indicador de tendencia para resúmenes en vivo.',
    dataReq: '1 Métrica Resumen',
    icon: Zap,
    badge: 'Esencial',
  },
  {
    id: 'table_hierarchical',
    title: 'Tabla Tabular Estructurada',
    category: 'composicion',
    categoryLabel: 'Composición & Resumen',
    description: 'Detalle de registros tabulares con alineación numérica monospace.',
    dataReq: 'Dimensiones y Métricas Libres',
    icon: TableIcon,
  },
] as const;

function ChartSilhouettePreview({ kind }: { readonly kind: DashboardCard['chartKind'] }) {
  switch (kind) {
    case 'line':
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="8" y1="16" x2="76" y2="16" stroke="currentColor" strokeOpacity="0.12" />
          <line x1="8" y1="28" x2="76" y2="28" stroke="currentColor" strokeOpacity="0.12" />
          <line x1="8" y1="42" x2="76" y2="42" stroke="currentColor" strokeOpacity="0.15" />
          <path d="M 8 38 C 22 36, 32 16, 46 24 C 58 32, 66 12, 76 16 L 76 42 L 8 42 Z" fill="url(#lineGrad)" className="text-primary" />
          <path d="M 8 38 C 22 36, 32 16, 46 24 C 58 32, 66 12, 76 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary" />
          <circle cx="76" cy="16" r="2.5" fill="currentColor" className="text-primary" />
        </svg>
      );

    case 'area':
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <line x1="8" y1="42" x2="76" y2="42" stroke="currentColor" strokeOpacity="0.15" />
          <path d="M 8 34 C 20 20, 36 38, 50 18 C 62 8, 68 22, 76 12 L 76 42 L 8 42 Z" fill="url(#areaGrad)" className="text-cyan-500" />
          <path d="M 8 34 C 20 20, 36 38, 50 18 C 62 8, 68 22, 76 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cyan-500" />
        </svg>
      );

    case 'bar_grouped':
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          <line x1="8" y1="44" x2="76" y2="44" stroke="currentColor" strokeOpacity="0.15" />
          <rect x="12" y="24" width="7" height="20" rx="2" fill="currentColor" className="text-primary" />
          <rect x="21" y="16" width="7" height="28" rx="2" fill="currentColor" className="text-primary/70" />
          <rect x="36" y="28" width="7" height="16" rx="2" fill="currentColor" className="text-primary" />
          <rect x="45" y="12" width="7" height="32" rx="2" fill="currentColor" className="text-primary/70" />
          <rect x="60" y="20" width="7" height="24" rx="2" fill="currentColor" className="text-primary" />
        </svg>
      );

    case 'bar_horizontal':
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          <line x1="12" y1="8" x2="12" y2="46" stroke="currentColor" strokeOpacity="0.15" />
          <rect x="14" y="10" width="58" height="6" rx="2" fill="currentColor" className="text-emerald-500" />
          <rect x="14" y="19" width="46" height="6" rx="2" fill="currentColor" className="text-emerald-500/80" />
          <rect x="14" y="28" width="34" height="6" rx="2" fill="currentColor" className="text-emerald-500/60" />
          <rect x="14" y="37" width="22" height="6" rx="2" fill="currentColor" className="text-emerald-500/40" />
        </svg>
      );

    case 'gauge':
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          {/* Background track: center (42, 33), radius 20, from 210° to -30° */}
          <path
            d="M 24.7 43 A 20 20 0 1 1 59.3 43"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeOpacity="0.15"
          />
          {/* Active progress: exact same circle arc from 210° to 42° */}
          <path
            d="M 24.7 43 A 20 20 0 0 1 56.9 19.6"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            className="text-primary"
          />
          <text
            x="42"
            y="37"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            70%
          </text>
        </svg>
      );

    case 'funnel':
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          <polygon points="12,10 72,10 64,20 20,20" fill="currentColor" className="text-violet-500" />
          <polygon points="21,22 63,22 55,32 29,32" fill="currentColor" className="text-violet-500/80" />
          <polygon points="30,34 54,34 48,44 36,44" fill="currentColor" className="text-violet-500/60" />
        </svg>
      );

    case 'donut':
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          <circle cx="42" cy="27" r="17" stroke="currentColor" strokeWidth="6" strokeOpacity="0.15" />
          <circle cx="42" cy="27" r="17" stroke="currentColor" strokeWidth="6" strokeDasharray="45 100" strokeDashoffset="20" strokeLinecap="round" className="text-rose-500" />
          <circle cx="42" cy="27" r="17" stroke="currentColor" strokeWidth="6" strokeDasharray="30 100" strokeDashoffset="70" strokeLinecap="round" className="text-amber-500" />
        </svg>
      );

    case 'kpi':
      return (
        <div className="w-full h-full flex flex-col justify-center items-center px-1">
          <span className="text-[12px] font-black font-mono tracking-tight text-foreground">$128.4k</span>
          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5 mt-0.5">
            ▲ +14.2%
          </span>
        </div>
      );

    case 'table_hierarchical':
    default:
      return (
        <svg className="w-full h-full" viewBox="0 0 84 54" fill="none">
          <rect x="8" y="10" width="68" height="8" rx="1.5" fill="currentColor" strokeOpacity="0.1" className="text-primary/20" />
          <line x1="8" y1="23" x2="76" y2="23" stroke="currentColor" strokeOpacity="0.12" />
          <line x1="8" y1="33" x2="76" y2="33" stroke="currentColor" strokeOpacity="0.12" />
          <line x1="8" y1="43" x2="76" y2="43" stroke="currentColor" strokeOpacity="0.12" />
          <rect x="12" y="13" width="16" height="3" rx="1" fill="currentColor" className="text-foreground/40" />
          <rect x="48" y="13" width="22" height="3" rx="1" fill="currentColor" className="text-foreground/40" />
          <rect x="12" y="26" width="20" height="3" rx="1" fill="currentColor" className="text-foreground/20" />
          <rect x="52" y="26" width="18" height="3" rx="1" fill="currentColor" className="text-foreground/30" />
          <rect x="12" y="36" width="14" height="3" rx="1" fill="currentColor" className="text-foreground/20" />
          <rect x="56" y="36" width="14" height="3" rx="1" fill="currentColor" className="text-foreground/30" />
        </svg>
      );
  }
}

interface ChartCatalogDrawerProps {
  readonly isOpen: boolean;
  readonly selectedKind: DashboardCard['chartKind'];
  readonly onSelect: (kind: DashboardCard['chartKind']) => void;
  readonly onClose: () => void;
}

export function ChartCatalogDrawer({
  isOpen,
  selectedKind,
  onSelect,
  onClose,
}: ChartCatalogDrawerProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const categoriesWithCounts = useMemo(() => {
    const counts = {
      all: CHART_CATALOG.length,
      tendencia: CHART_CATALOG.filter((i) => i.category === 'tendencia').length,
      comparacion: CHART_CATALOG.filter((i) => i.category === 'comparacion').length,
      metas: CHART_CATALOG.filter((i) => i.category === 'metas').length,
      composicion: CHART_CATALOG.filter((i) => i.category === 'composicion').length,
    };
    return [
      { id: 'all', label: `Todos (${counts.all})` },
      { id: 'tendencia', label: `Tendencia (${counts.tendencia})` },
      { id: 'comparacion', label: `Comparación (${counts.comparacion})` },
      { id: 'metas', label: `Metas & Embudo (${counts.metas})` },
      { id: 'composicion', label: `Composición (${counts.composicion})` },
    ];
  }, []);

  const filteredItems =
    activeCategory === 'all'
      ? CHART_CATALOG
      : CHART_CATALOG.filter((item) => item.category === activeCategory);

  return (
    <aside
      className={`h-full border-surface-border bg-surface flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOpen
          ? 'w-88 opacity-100 border-l'
          : 'w-0 opacity-0 pointer-events-none border-l-0'
      }`}
    >
      <div className="w-88 h-full flex flex-col overflow-hidden">
        {/* Panel Header - Integrated Studio Style */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-surface-subtle text-foreground border border-surface-border shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                Catálogo de Visualizaciones
              </span>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-foreground truncate">
                  Explorador de Gráficos
                </h2>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  En vivo
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-subtle transition-all duration-150 shrink-0"
            title="Ocultar catálogo (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-4 py-2.5 border-b border-surface-border flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 bg-surface">
          {categoriesWithCounts.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-foreground text-background shadow-xs font-bold'
                  : 'bg-surface-subtle border border-surface-border text-muted hover:text-foreground hover:bg-surface-subtle/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Cards List - Twin of Left Step Styling */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-surface">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = selectedKind === item.id;
            const isFirstOfCategory =
              activeCategory === 'all' &&
              (index === 0 || item.category !== filteredItems[index - 1]?.category);
            const categoryCount = CHART_CATALOG.filter((c) => c.category === item.category).length;

            return (
              <div key={item.id} className="space-y-1.5">
                {isFirstOfCategory && (
                  <div className="pt-2 pb-0.5 flex items-center justify-between border-b border-surface-border/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[9px] font-semibold text-muted bg-surface-subtle px-1.5 py-0.2 rounded-md border border-surface-border">
                      {categoryCount}
                    </span>
                  </div>
                )}
                <div
                  onClick={() => {
                    onSelect(item.id);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 flex items-start gap-3 group ${
                    isSelected
                      ? 'border-primary/60 bg-primary/[0.04] ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:border-surface-border hover:bg-surface-subtle/60'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg border shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-surface-subtle text-muted border-surface-border group-hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <h3
                          className={`text-xs font-bold leading-snug ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {item.title}
                        </h3>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0 border border-primary/25 mt-0.5">
                          <Check className="h-2.5 w-2.5" />
                          <span>Activo</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border">
                        📋 {item.dataReq}
                      </span>
                    </div>
                  </div>

                  {/* SVG Silhouette Mini-Preview Box */}
                  <div
                    className={`w-16 h-12 rounded-lg border shrink-0 overflow-hidden flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-surface border-primary/30 shadow-2xs'
                        : 'bg-surface-subtle/50 border-surface-border group-hover:border-surface-border group-hover:bg-surface'
                    }`}
                  >
                    <ChartSilhouettePreview kind={item.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel Footer */}
        <div className="p-3.5 border-t border-surface-border bg-surface flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] text-muted truncate">
              Gráfico: <strong className="text-foreground">{CHART_CATALOG.find((c) => c.id === selectedKind)?.title.split('(')[0]}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-surface-border hover:bg-surface-subtle text-foreground text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
          >
            <Check className="h-3.5 w-3.5 text-primary" />
            <span>Listo</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
