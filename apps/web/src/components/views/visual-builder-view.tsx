'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardCard } from '@bi/contracts';
import {
  aggregateData,
  fetchPostgresTableRows,
  type DataSource,
  type DataTable,
} from '../../lib/data-sources';
import { EChartsView } from '../charts/echarts-view';
import {
  ACCENT_COLOR_PRESETS,
  type AccentColorName,
  buildModernAreaOption,
  buildModernBarOption,
  buildModernDonutOption,
  buildModernFunnelOption,
  buildModernGaugeOption,
  buildModernHorizontalBarOption,
  buildModernLineOption,
} from '../../lib/chart-theme';
import {
  CHART_CATALOG,
  ChartCatalogDrawer,
} from '../charts/chart-catalog-drawer';
import * as echarts from 'echarts';
import {
  Check,
  CreditCard,
  DollarSign,
  Palette,
  Save,
  ShoppingBag,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

export type TitleFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type TitleFontWeight = 'medium' | 'bold' | 'extrabold';
export type BadgeStyle = 'subtle' | 'solid' | 'pulse' | 'pill_tint' | 'pill_gradient' | 'pill_dark';
export type BadgePosition = 'inline' | 'top_right' | 'top_left' | 'bottom_right' | 'bottom_left';
export type HeaderPosition = 'top' | 'bottom';
export type HeaderAlignment = 'left' | 'center' | 'right';
export type ColorMode = 'gradient' | 'palette' | 'solid';
export type CardTheme = 'standard' | 'tinted' | 'gradient' | 'glass';

interface VisualBuilderViewProps {
  readonly dataSources: readonly DataSource[];
  readonly preselectedSourceId?: string;
  readonly preselectedTableId?: string;
  readonly onSaveToDashboard: (card: {
    title: string;
    titleSize?: TitleFontSize;
    titleFontSize?: number;
    titleWeight?: TitleFontWeight;
    subtitle?: string;
    subtitleFontSize?: number;
    cardTheme?: CardTheme;
    headerPosition?: HeaderPosition;
    headerAlignment?: HeaderAlignment;
    colorMode?: ColorMode;
    chartKind: DashboardCard['chartKind'];
    echartsOption: echarts.EChartsOption;
    sourceName: string;
    tableName: string;
    summaryValue?: string;
    badge?: string;
    badgeStyle?: BadgeStyle;
    badgePosition?: BadgePosition;
    accentColor?: string;
    kpiIcon?: 'dollar' | 'orders' | 'ticket' | 'wallet' | 'trend' | 'users' | 'zap' | 'target';
    goalValue?: number;
  }) => void;
  readonly onOpenUploadExcel: () => void;
  readonly isDarkMode?: boolean;
}

export function VisualBuilderView({
  dataSources,
  preselectedSourceId,
  preselectedTableId,
  onSaveToDashboard,
  onOpenUploadExcel,
  isDarkMode = false,
}: VisualBuilderViewProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    preselectedSourceId || dataSources[0]?.id || '',
  );
  const [selectedTableId, setSelectedTableId] = useState<string>(
    preselectedTableId || '',
  );
  const [chartKind, setChartKind] = useState<DashboardCard['chartKind']>('bar_grouped');
  const [isCatalogDrawerOpen, setIsCatalogDrawerOpen] = useState(false);

  // Field assignments & Typography
  const [title, setTitle] = useState('');
  const [titleFontSize, setTitleFontSize] = useState<number>(16);
  const titleSize: TitleFontSize =
    titleFontSize <= 12 ? 'sm' : titleFontSize <= 16 ? 'base' : titleFontSize <= 20 ? 'lg' : 'xl';
  const [titleWeight, setTitleWeight] = useState<TitleFontWeight>('bold');
  const [subtitle, setSubtitle] = useState('');
  const [subtitleFontSize, setSubtitleFontSize] = useState<number>(11);
  const [cardTheme, setCardTheme] = useState<CardTheme>('standard');
  const [headerPosition, setHeaderPosition] = useState<HeaderPosition>('top');
  const [headerAlignment, setHeaderAlignment] = useState<HeaderAlignment>('left');
  const [xField, setXField] = useState('');
  const [yField, setYField] = useState('');
  const [aggFn, setAggFn] = useState<'sum' | 'count' | 'avg' | 'min' | 'max'>('sum');
  const [goalValue, setGoalValue] = useState<number>(100000);

  // Personalization & Branding
  const [selectedAccentColor, setSelectedAccentColor] = useState<AccentColorName>('blue');
  const [customHex, setCustomHex] = useState('');
  const [colorMode, setColorMode] = useState<ColorMode>('gradient');
  const [showBadge, setShowBadge] = useState<boolean>(false);
  const [badgeText, setBadgeText] = useState('');
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>('pill_tint');
  const [badgePosition, setBadgePosition] = useState<BadgePosition>('top_right');
  const [kpiIcon, setKpiIcon] = useState<
    'dollar' | 'orders' | 'ticket' | 'wallet' | 'trend' | 'users' | 'zap' | 'target'
  >('dollar');

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

  const activeCatalogItem = useMemo(() => {
    const found = CHART_CATALOG.find((item) => item.id === chartKind);
    if (found) return found;
    return CHART_CATALOG[0]!;
  }, [chartKind]);

  const activePreset = useMemo(() => {
    const found = ACCENT_COLOR_PRESETS.find((p) => p.id === selectedAccentColor);
    if (found) return found;
    return ACCENT_COLOR_PRESETS[0]!;
  }, [selectedAccentColor]);

  // Active hex is custom color if valid, otherwise preset
  const activeHex = useMemo(() => {
    const trimmed = customHex.trim();
    if (trimmed && /^#([0-9A-Fa-f]{3}){1,2}$/.test(trimmed)) {
      return trimmed;
    }
    return activePreset.hex;
  }, [customHex, activePreset.hex]);

  const computedTitle =
    title ||
    `${activeCatalogItem.title.split(' ')[0]} de ${activeYField || 'Métrica'} por ${activeXField || 'Dimensión'}`;

  // Live PostgreSQL rows state for real database querying
  const [liveRows, setLiveRows] = useState<Record<string, unknown>[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);

  useEffect(() => {
    if (currentSource?.connectionConfig && currentTable?.schema && currentTable?.tableName) {
      setIsFetchingLive(true);
      fetchPostgresTableRows(
        currentSource.connectionConfig,
        currentTable.schema,
        currentTable.tableName,
        250,
      ).then((res) => {
        setIsFetchingLive(false);
        if (!res.error) {
          setLiveRows(res.rows);
        }
      });
    } else {
      setLiveRows([]);
    }
  }, [currentSource?.id, currentTable?.id]);

  const activeRows = useMemo(() => {
    if (currentSource?.connectionConfig) {
      return liveRows;
    }
    return currentTable?.rows || [];
  }, [currentSource, currentTable, liveRows]);

  // Execute Real Aggregation
  const aggResult = useMemo(() => {
    if (!currentTable || activeRows.length === 0 || !activeXField || !activeYField) {
      return { categories: [], values: [], totalSum: 0 };
    }
    return aggregateData(activeRows, activeXField, activeYField, aggFn);
  }, [currentTable, activeRows, activeXField, activeYField, aggFn]);

  // Build ECharts Configuration across 9 Chart Types with Direct Color Sync
  const chartOption = useMemo<echarts.EChartsOption>(() => {
    const isDark = isDarkMode;
    const categories = aggResult.categories as string[];
    const values = aggResult.values as number[];

    switch (chartKind) {
      case 'gauge':
        return buildModernGaugeOption(
          aggResult.totalSum,
          goalValue || 100000,
          activeYField || 'Objetivo',
          isDark,
          activeHex,
        );

      case 'funnel': {
        const funnelData = categories.map((cat, i) => ({
          name: cat,
          value: values[i] ?? 0,
        }));
        return buildModernFunnelOption(funnelData, activeYField, isDark, activeHex);
      }

      case 'area':
        return buildModernAreaOption(
          categories,
          values,
          `${aggFn.toUpperCase()}(${activeYField})`,
          isDark,
          activeHex,
        );

      case 'bar_horizontal':
        return buildModernHorizontalBarOption(
          categories,
          values,
          `${aggFn.toUpperCase()}(${activeYField})`,
          isDark,
          activeHex,
          colorMode,
        );

      case 'donut': {
        const donutData = categories.map((cat, i) => ({
          name: cat,
          value: values[i] ?? 0,
        }));
        return buildModernDonutOption(donutData, activeYField, isDark, activeHex);
      }

      case 'line':
        return buildModernLineOption(categories, values, activeYField, isDark, activeHex);

      case 'bar_grouped':
      default:
        return buildModernBarOption(
          categories,
          values,
          `${aggFn.toUpperCase()}(${activeYField})`,
          isDark,
          activeHex,
          colorMode,
        );
    }
  }, [aggResult, chartKind, activeYField, aggFn, goalValue, activeHex, colorMode, isDarkMode]);

  const handleSave = () => {
    onSaveToDashboard({
      title: computedTitle,
      titleSize,
      titleFontSize,
      titleWeight,
      subtitle: subtitle.trim() || undefined,
      subtitleFontSize,
      cardTheme,
      headerPosition,
      headerAlignment,
      colorMode,
      chartKind,
      echartsOption: chartOption,
      sourceName: currentSource?.name || 'Origen',
      tableName: currentTable?.name || 'Tabla',
      summaryValue: `$${aggResult.totalSum.toLocaleString()}`,
      badge: showBadge && badgeText.trim() ? badgeText.trim() : undefined,
      badgeStyle,
      badgePosition,
      accentColor: activeHex,
      kpiIcon,
      goalValue: chartKind === 'gauge' ? goalValue : undefined,
    });
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const SelectedIcon = activeCatalogItem.icon;

  const renderBadgeElement = () => {
    if (!showBadge || !badgeText.trim()) return null;

    if (badgeStyle === 'pill_tint') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs transition-all border shrink-0"
          style={{
            backgroundColor: `${activeHex}18`,
            borderColor: `${activeHex}45`,
            color: activeHex,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: activeHex }}
          />
          <span>{badgeText}</span>
        </span>
      );
    }

    if (badgeStyle === 'pill_gradient') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm transition-all border border-white/25 shrink-0"
          style={{
            background: `linear-gradient(135deg, ${activeHex}, #1e293b)`,
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/90 shrink-0" />
          <span>{badgeText}</span>
        </span>
      );
    }

    if (badgeStyle === 'pill_dark') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 shadow-xs shrink-0">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: activeHex }}
          />
          <span>{badgeText}</span>
        </span>
      );
    }

    if (badgeStyle === 'solid') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs shrink-0"
          style={{ backgroundColor: activeHex }}
        >
          <span>{badgeText}</span>
        </span>
      );
    }

    if (badgeStyle === 'pulse') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-subtle text-foreground border border-surface-border shadow-xs shrink-0">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: activeHex }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: activeHex }}
            />
          </span>
          <span>{badgeText}</span>
        </span>
      );
    }

    // Default 'subtle'
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-surface-subtle text-muted hover:text-foreground border border-surface-border shrink-0">
        <span>{badgeText}</span>
      </span>
    );
  };

  const renderCardHeader = (isBottom = false) => (
    <div
      className={`${
        isBottom
          ? 'border-t border-surface-border/60 pt-3.5 mt-2.5'
          : 'border-b border-surface-border/60 pb-3.5 mb-2.5'
      } flex items-center justify-between shrink-0 gap-3 min-w-0`}
    >
      <div
        className={`flex items-center gap-2 min-w-0 flex-1 ${
          headerAlignment === 'center'
            ? 'justify-center text-center'
            : headerAlignment === 'right'
            ? 'justify-end text-right'
            : 'justify-start text-left'
        }`}
      >
        <div
          className={`flex flex-col min-w-0 ${
            headerAlignment === 'center'
              ? 'items-center'
              : headerAlignment === 'right'
              ? 'items-end'
              : 'items-start'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {badgePosition === 'top_left' && renderBadgeElement()}
            <h3
              style={{ fontSize: `${titleFontSize}px` }}
              className={`tracking-tight ${cardTheme === 'gradient' ? 'text-white' : 'text-foreground'} ${
                titleWeight === 'medium'
                  ? 'font-medium'
                  : titleWeight === 'bold'
                  ? 'font-bold'
                  : 'font-black'
              }`}
            >
              {computedTitle}
            </h3>
            {badgePosition === 'inline' && renderBadgeElement()}
          </div>
          {subtitle && (
            <p
              style={{ fontSize: `${subtitleFontSize}px` }}
              className={`mt-0.5 leading-snug ${cardTheme === 'gradient' ? 'text-white/80' : 'text-muted'}`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badgePosition === 'top_right' && renderBadgeElement()}
        <div
          className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-xs shrink-0"
          style={{ backgroundColor: activeHex }}
          title={`Color de Acento: ${activeHex}`}
        />
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* Left Configuration Drawer */}
      <div className="w-88 border-r border-surface-border bg-surface flex flex-col p-5 gap-5 shrink-0 overflow-y-auto">
        {/* Step 1: Origen y Tabla */}
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
                    {t.name} ({currentSource?.connectionConfig ? (t.rowCountEstimate ? `~${t.rowCountEstimate} filas` : 'En Vivo') : `${t.rows.length} filas`})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Asignación de Campos */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            Paso 2: Asignación de Campos
          </span>

          <div>
            <span className="block text-[11px] font-medium text-muted mb-1">
              {chartKind === 'funnel' ? 'Etapa del Embudo' : 'Eje X (Agrupar por / Dimensión)'}
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

          {/* Conditional Target Field for Gauge */}
          {chartKind === 'gauge' && (
            <div>
              <span className="block text-[11px] font-medium text-muted mb-1">
                🎯 Meta Objetivo Comercial
              </span>
              <input
                type="number"
                value={goalValue}
                onChange={(e) => setGoalValue(Number(e.target.value) || 100000)}
                className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Step 3: Personalización & Marca (VITALIDAD & CONTROL TOTAL) */}
        <div className="pt-4 border-t border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
              Paso 3: Personalización & Estilo
            </span>
            <Palette className="h-3.5 w-3.5 text-primary" />
          </div>

          {/* Posición y Alineación de la Franja / Header */}
          <div className="space-y-1.5 p-2.5 rounded-xl border border-surface-border bg-surface-subtle/50">
            <span className="text-[11px] font-semibold text-foreground block">
              Posición y Franja del Encabezado
            </span>
            <div className="flex items-center gap-2">
              {/* Top vs Bottom Header */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-surface-border bg-surface flex-1">
                <button
                  type="button"
                  onClick={() => setHeaderPosition('top')}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all text-center ${
                    headerPosition === 'top'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Encabezado estándar arriba"
                >
                  Arriba
                </button>
                <button
                  type="button"
                  onClick={() => setHeaderPosition('bottom')}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-all text-center ${
                    headerPosition === 'bottom'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Franja inferior (estilo terminal de datos / métricas)"
                >
                  Abajo
                </button>
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg border border-surface-border bg-surface">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => setHeaderAlignment(align)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                      headerAlignment === align
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover:text-foreground'
                    }`}
                    title={align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
                  >
                    {align === 'left' ? '◀' : align === 'center' ? '▲' : '▶'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography: Title, Exact Pixel Size & Weight */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">Título de la Tarjeta</span>
              {/* Weight Selector */}
              <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-md border border-surface-border">
                {(['medium', 'bold', 'extrabold'] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setTitleWeight(w)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                      titleWeight === w
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted hover:text-foreground'
                    }`}
                    title={w === 'medium' ? 'Regular 400' : w === 'bold' ? 'Negrita 700' : 'Impacto Black 900'}
                  >
                    {w === 'medium' ? 'R' : w === 'bold' ? 'B' : '900'}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={title}
              placeholder={computedTitle}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />

            {/* Exact Font Size Slider + Number Input + Quick Chips */}
            <div className="p-2 rounded-xl border border-surface-border bg-surface-subtle/40 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span className="font-semibold text-foreground">Tamaño exacto:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={11}
                    max={32}
                    value={titleFontSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setTitleFontSize(Math.max(11, Math.min(32, val)));
                    }}
                    className="w-12 px-1 py-0.5 text-right font-mono text-xs font-bold rounded border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <span className="font-mono text-muted text-[10px]">px</span>
                </div>
              </div>
              <input
                type="range"
                min={11}
                max={32}
                value={titleFontSize}
                onChange={(e) => setTitleFontSize(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex items-center gap-1 justify-between pt-0.5">
                {[12, 14, 16, 18, 22, 26].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTitleFontSize(sz)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold transition-all ${
                      titleFontSize === sz
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'text-muted hover:text-foreground bg-surface border border-surface-border'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subtitle with Exact Font Size Control */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                Subtítulo / Contexto Comercial
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted">Tamaño:</span>
                <input
                  type="number"
                  min={9}
                  max={20}
                  value={subtitleFontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setSubtitleFontSize(Math.max(9, Math.min(20, val)));
                  }}
                  className="w-10 px-1 py-0.5 text-right font-mono text-xs font-bold rounded border border-surface-border bg-surface text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
                <span className="font-mono text-muted text-[10px]">px</span>
              </div>
            </div>
            <input
              type="text"
              value={subtitle}
              placeholder="Ej: Medido sobre clientes activos en el último mes"
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
            {/* Subtitle Font Size Slider and Quick Chips */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <input
                type="range"
                min={9}
                max={20}
                value={subtitleFontSize}
                onChange={(e) => setSubtitleFontSize(parseInt(e.target.value, 10))}
                className="w-24 h-1.5 bg-surface-border rounded-lg appearance-none cursor-pointer accent-primary shrink-0"
              />
              <div className="flex items-center gap-1">
                {[9, 11, 12, 14, 16].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSubtitleFontSize(sz)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold transition-all ${
                      subtitleFontSize === sz
                        ? 'bg-primary text-white font-bold shadow-xs'
                        : 'text-muted hover:text-foreground bg-surface border border-surface-border'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card Theme / Model Selector (Executive Depth, Tint, Gradient, Glass) */}
          <div className="space-y-1.5 p-2.5 rounded-xl border border-surface-border bg-surface-subtle/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                Estilo & Modelo de Tarjeta
              </span>
              <span className="text-[10px] text-muted capitalize font-medium">{cardTheme}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-surface rounded-lg border border-surface-border text-center">
              {[
                { id: 'standard', label: 'Estándar', desc: 'Sombra ejecutiva' },
                { id: 'tinted', label: 'Tintada', desc: 'Matiz de marca' },
                { id: 'gradient', label: 'Gradiente', desc: 'Vibrante análisis' },
                { id: 'glass', label: 'Glass', desc: 'Vidrio esmerilado' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setCardTheme(theme.id as CardTheme)}
                  className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all ${
                    cardTheme === theme.id
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title={theme.desc}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets & Custom Hex Color (ZERO OVERLAP + SPACING) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                Color de Gráfico & Marca
              </span>
              <span className="text-[10px] font-mono font-bold text-foreground/80">
                {activeHex}
              </span>
            </div>

            {/* Presets with ample gap-3.5 and clear ring */}
            <div className="flex items-center gap-3.5 py-1.5 px-1 overflow-x-auto">
              {ACCENT_COLOR_PRESETS.map((preset) => {
                const isSelected = selectedAccentColor === preset.id && !customHex;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAccentColor(preset.id);
                      setCustomHex('');
                    }}
                    title={preset.label}
                    className={`h-7 w-7 rounded-full transition-all shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface scale-105 shadow-sm'
                        : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-white drop-shadow stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex Picker Input */}
            <div className="flex items-center gap-2 p-1.5 rounded-lg border border-surface-border bg-surface-subtle/60">
              <input
                type="color"
                value={activeHex}
                onChange={(e) => {
                  setCustomHex(e.target.value);
                }}
                className="w-6 h-6 p-0 rounded-md border border-surface-border bg-transparent cursor-pointer shrink-0"
                title="Selector de color personalizado"
              />
              <input
                type="text"
                value={customHex}
                placeholder="Hex libre (ej: #0EA5E9)"
                onChange={(e) => setCustomHex(e.target.value)}
                className="flex-1 bg-transparent text-xs font-mono font-bold uppercase text-foreground placeholder:text-muted focus:outline-none"
              />
              {customHex && (
                <button
                  type="button"
                  onClick={() => setCustomHex('')}
                  className="text-[10px] text-muted hover:text-foreground shrink-0 font-medium"
                >
                  Restablecer
                </button>
              )}
            </div>

            {/* Color Mode: Gradient, Palette, Solid */}
            <div className="pt-1">
              <span className="block text-[10px] font-semibold text-muted mb-1">
                Estilo de Color del Gráfico
              </span>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-surface-subtle rounded-lg border border-surface-border text-center">
                <button
                  type="button"
                  onClick={() => setColorMode('gradient')}
                  className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all ${
                    colorMode === 'gradient'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Degradado suave con luminosidad"
                >
                  Degradado
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('palette')}
                  className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all ${
                    colorMode === 'palette'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Multicolor armónico por categoría"
                >
                  Multicolor
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('solid')}
                  className={`py-1 px-1 rounded-md text-[10px] font-bold transition-all ${
                    colorMode === 'solid'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                  title="Color sólido puro"
                >
                  Sólido
                </button>
              </div>
            </div>
          </div>

          {/* Badge Selection & Placement (100% Optional & Flexible) */}
          <div className="space-y-2 pt-2 border-t border-surface-border/70">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBadge}
                  onChange={(e) => setShowBadge(e.target.checked)}
                  className="rounded border-surface-border text-primary focus:ring-primary h-3.5 w-3.5 accent-primary"
                />
                <span className="text-[11px] font-semibold text-foreground">
                  Activar Etiqueta / Badge
                </span>
              </label>

              {showBadge && (
                <div className="flex flex-wrap items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-surface-border">
                  {[
                    { id: 'pill_tint' as const, label: 'Matiz' },
                    { id: 'pill_gradient' as const, label: 'Gradiente' },
                    { id: 'pill_dark' as const, label: 'Oscuro' },
                    { id: 'pulse' as const, label: 'Pulso' },
                    { id: 'solid' as const, label: 'Sólido' },
                    { id: 'subtle' as const, label: 'Sutil' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setBadgeStyle(style.id)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                        badgeStyle === style.id
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {showBadge && (
              <div className="space-y-2 pl-2 border-l-2 border-primary/40 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={badgeText}
                  placeholder="Escribe el nombre del badge..."
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                />

                {/* Quick Suggestions that populate the text input */}
                <div className="flex flex-wrap gap-1">
                  {['Meta Superada', 'En Vivo', 'Alerta', 'Prioritario', 'Q3 Final', 'Borrador'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBadgeText(p)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                        badgeText === p
                          ? 'bg-primary text-white'
                          : 'bg-surface-subtle text-muted hover:text-foreground border border-surface-border'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Badge Position Selector (5 Positions) */}
                <div>
                  <span className="block text-[10px] font-semibold text-muted mb-1">
                    Posición del Badge:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'top_left' as const, label: 'Sup. Izq' },
                      { id: 'inline' as const, label: 'Junto Título' },
                      { id: 'top_right' as const, label: 'Sup. Der' },
                      { id: 'bottom_left' as const, label: 'Inf. Izq' },
                      { id: 'bottom_right' as const, label: 'Inf. Der' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setBadgePosition(pos.id)}
                        className={`px-1.5 py-1 rounded text-[9px] font-semibold transition-all truncate text-center ${
                          badgePosition === pos.id
                            ? 'bg-primary text-white font-bold shadow-xs'
                            : 'bg-surface-subtle text-muted hover:text-foreground border border-surface-border'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KPI Icon Picker if chartKind is kpi */}
          {chartKind === 'kpi' && (
            <div>
              <span className="block text-[11px] font-medium text-muted mb-1.5">
                Icono de la Métrica
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'dollar', icon: DollarSign, label: 'Dólar' },
                  { id: 'orders', icon: ShoppingBag, label: 'Ventas' },
                  { id: 'ticket', icon: CreditCard, label: 'Ticket' },
                  { id: 'wallet', icon: Wallet, label: 'Caja' },
                  { id: 'trend', icon: TrendingUp, label: 'Tendencia' },
                  { id: 'users', icon: Users, label: 'Clientes' },
                  { id: 'zap', icon: Zap, label: 'Rendimiento' },
                  { id: 'target', icon: Target, label: 'Meta' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = kpiIcon === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setKpiIcon(item.id as typeof kpiIcon)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm font-bold'
                          : 'border-surface-border bg-surface-subtle text-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[9px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Save CTA */}
        <div className="mt-auto pt-4 border-t border-surface-border space-y-2">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-md transition-all active:scale-[0.98]"
          >
            {isSavedFeedback ? <Check className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
            <span>{isSavedFeedback ? '¡Guardado en Dashboard!' : 'Guardar en Dashboard'}</span>
          </button>
        </div>
      </div>

      {/* Main Central Canvas with Live Visualization Preview */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300">
        {/* Top Breadcrumb & Status Header */}
        <div className="p-4 border-b border-surface-border bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted font-medium truncate">{currentSource?.name} &gt;</span>
            <span className="text-xs text-muted font-medium truncate">{currentTable?.name} &gt;</span>
            <h2 className="text-sm font-bold text-foreground truncate">{computedTitle}</h2>
            {currentSource?.connectionConfig && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-success/10 text-success border border-success/20 shrink-0">
                <span className={`h-1.5 w-1.5 rounded-full bg-success ${isFetchingLive ? 'animate-ping' : 'animate-pulse'}`} />
                <span>{isFetchingLive ? 'Consultando...' : 'PostgreSQL En Vivo'}</span>
              </span>
            )}
            {badgeText && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-subtle text-foreground border border-surface-border shrink-0">
                {badgeText}
              </span>
            )}
          </div>

          {/* Chart Switcher / Catalog Inspector Trigger */}
          <button
            type="button"
            onClick={() => setIsCatalogDrawerOpen((prev) => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold shadow-xs active:scale-95 shrink-0 ${
              isCatalogDrawerOpen
                ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                : 'border-surface-border bg-surface hover:bg-surface-subtle text-foreground'
            }`}
            title={isCatalogDrawerOpen ? 'Ocultar catálogo de gráficos' : 'Abrir catálogo de gráficos'}
          >
            <SelectedIcon className="h-4 w-4 text-primary" />
            <span className="font-bold">{activeCatalogItem.title.split('(')[0]}</span>
            {isCatalogDrawerOpen ? (
              <X className="h-3.5 w-3.5 text-muted ml-0.5" />
            ) : (
              <span className="text-[10px] text-muted font-normal bg-surface-subtle px-1.5 py-0.5 rounded border border-surface-border ml-0.5">
                Cambiar
              </span>
            )}
          </button>
        </div>

        {/* Central Visualization Canvas */}
        <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-slate-100 dark:bg-slate-950">
          <div
            className={`w-full max-w-4xl rounded-3xl p-7 min-h-[440px] flex flex-col justify-between relative overflow-hidden transition-all card-executive ${
              cardTheme === 'gradient'
                ? 'text-white'
                : cardTheme === 'glass'
                ? 'bg-white/80 backdrop-blur-2xl border border-white/40 dark:border-white/10 dark:bg-slate-900/80'
                : cardTheme === 'tinted'
                ? 'bg-white dark:bg-slate-900 border'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
            }`}
            style={{
              background:
                cardTheme === 'gradient'
                  ? `linear-gradient(135deg, ${activeHex}, #1e293b)`
                  : cardTheme === 'tinted'
                  ? `linear-gradient(135deg, hsl(var(--surface)) 70%, ${activeHex}15 100%)`
                  : undefined,
              borderColor:
                cardTheme === 'tinted'
                  ? `${activeHex}60`
                  : cardTheme === 'gradient'
                  ? `${activeHex}80`
                  : undefined,
            }}
          >
            {/* Header if position === 'top' */}
            {headerPosition === 'top' && renderCardHeader(false)}

            {/* Preview Body */}
            <div className="flex-1 flex items-center justify-center min-h-[340px]">
              {chartKind === 'kpi' ? (
                <div className="text-center py-10 space-y-3">
                  <div
                    className="p-3.5 rounded-2xl border mx-auto w-fit shadow-sm"
                    style={{
                      borderColor: `${activeHex}40`,
                      backgroundColor: `${activeHex}15`,
                      color: activeHex,
                    }}
                  >
                    {kpiIcon === 'dollar' && <DollarSign className="h-6 w-6" />}
                    {kpiIcon === 'orders' && <ShoppingBag className="h-6 w-6" />}
                    {kpiIcon === 'ticket' && <CreditCard className="h-6 w-6" />}
                    {kpiIcon === 'wallet' && <Wallet className="h-6 w-6" />}
                    {kpiIcon === 'trend' && <TrendingUp className="h-6 w-6" />}
                    {kpiIcon === 'users' && <Users className="h-6 w-6" />}
                    {kpiIcon === 'zap' && <Zap className="h-6 w-6" />}
                    {kpiIcon === 'target' && <Target className="h-6 w-6" />}
                  </div>
                  <div className="text-5xl font-black text-foreground font-mono">
                    ${aggResult.totalSum.toLocaleString()}
                  </div>
                  <div
                    className="text-xs font-semibold flex items-center justify-center gap-1.5 px-3 py-1 rounded-full w-fit mx-auto border"
                    style={{
                      borderColor: `${activeHex}30`,
                      backgroundColor: `${activeHex}10`,
                      color: activeHex,
                    }}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Calculado sobre {currentTable?.rows.length} registros</span>
                  </div>
                </div>
              ) : chartKind === 'table_hierarchical' ? (
                <div className="w-full overflow-x-auto rounded-xl border border-surface-border">
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
                <div className="w-full">
                  <EChartsView
                    isDarkMode={isDarkMode}
                    options={chartOption}
                    height={340}
                  />
                </div>
              )}
            </div>

            {/* Header if position === 'bottom' */}
            {headerPosition === 'bottom' && renderCardHeader(true)}

            {/* Dedicated Bottom Badge Footer for bottom_left / bottom_right */}
            {showBadge && badgeText.trim() && (badgePosition === 'bottom_left' || badgePosition === 'bottom_right') && (
              <div
                className={`pt-2.5 mt-2 border-t border-surface-border/60 flex items-center ${
                  badgePosition === 'bottom_left' ? 'justify-start' : 'justify-end'
                }`}
              >
                {renderBadgeElement()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorized Chart Catalog Drawer */}
      <ChartCatalogDrawer
        isOpen={isCatalogDrawerOpen}
        selectedKind={chartKind}
        onSelect={(newKind) => setChartKind(newKind)}
        onClose={() => setIsCatalogDrawerOpen(false)}
      />
    </div>
  );
}
