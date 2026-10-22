import * as echarts from 'echarts';

/**
 * Curated Metabase / Stripe SaaS BI Color Palette
 * Zero tacky default colors; elegant, accessible, high-contrast in light and dark mode.
 */
export const SAAS_PALETTE_LIGHT = [
  '#2563EB', // Vibrant Blue
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#D97706', // Amber
  '#0891B2', // Cyan
  '#DB2777', // Pink Rose
  '#4F46E5', // Indigo
] as const;

export const SAAS_PALETTE_DARK = [
  '#60A5FA', // Bright Sky Blue
  '#34D399', // Bright Emerald
  '#A78BFA', // Bright Violet
  '#FBBF24', // Bright Amber
  '#22D3EE', // Bright Cyan
  '#F472B6', // Bright Pink
  '#818CF8', // Bright Indigo
] as const;

export interface ChartThemeTokens {
  readonly isDark: boolean;
  readonly splitLineColor: string;
  readonly axisBaseLineColor: string;
  readonly axisLabelColor: string;
  readonly pointerColor: string;
  readonly tooltipBg: string;
  readonly tooltipBorder: string;
  readonly tooltipText: string;
  readonly palette: readonly string[];
}

export function getChartThemeTokens(isDark: boolean): ChartThemeTokens {
  return {
    isDark,
    // Crisp, clearly visible grid lines in light mode, subtle in dark mode
    splitLineColor: isDark ? 'rgba(71, 85, 105, 0.45)' : 'rgba(203, 213, 225, 0.75)',
    axisBaseLineColor: isDark ? 'rgba(71, 85, 105, 0.5)' : '#cbd5e1',
    axisLabelColor: isDark ? '#e2e8f0' : '#334155', // Slate-200 in dark, Slate-700 in light
    pointerColor: isDark ? '#64748b' : '#64748b',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#cbd5e1',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
    palette: isDark ? SAAS_PALETTE_DARK : SAAS_PALETTE_LIGHT,
  };
}

/**
 * Common modern tooltip with shadow, rounded corners, and crisp typography.
 */
export function getModernTooltip(
  tokens: ChartThemeTokens,
  trigger: 'axis' | 'item' = 'axis',
): echarts.TooltipComponentOption {
  return {
    trigger,
    backgroundColor: tokens.tooltipBg,
    borderColor: tokens.tooltipBorder,
    borderWidth: 1,
    padding: [10, 14],
    axisPointer: {
      type: 'line' as const,
      lineStyle: {
        color: tokens.pointerColor,
        type: 'dashed' as const,
        width: 1,
      },
    },
    textStyle: {
      color: tokens.tooltipText,
      fontSize: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 500,
    },
    extraCssText: tokens.isDark
      ? 'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4); border-radius: 10px; color: #f8fafc;'
      : 'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border-radius: 10px; color: #0f172a;',
  };
}

export function hexToRgba(hex: string, alpha = 1): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt((cleanHex[0] ?? '0') + (cleanHex[0] ?? '0'), 16);
    const g = parseInt((cleanHex[1] ?? '0') + (cleanHex[1] ?? '0'), 16);
    const b = parseInt((cleanHex[2] ?? '0') + (cleanHex[2] ?? '0'), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

/**
 * Modern Bar Chart Options with subtle dashed grid, grounded baseline, and rounded bars.
 */
export function buildModernBarOption(
  categories: readonly string[],
  values: readonly number[],
  seriesName: string,
  isDark = false,
  accentColor?: string,
  colorMode: 'gradient' | 'palette' | 'solid' = 'gradient',
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);
  const color = accentColor || (isDark ? '#60A5FA' : '#3B82F6');
  const palette = [color, ...tokens.palette.filter((c) => c.toLowerCase() !== color.toLowerCase())];

  const hasLongLabels = categories.some((c) => (c || '').length > 8);
  const rotationAngle = categories.length > 5 || hasLongLabels ? 25 : 0;
  const bottomMargin = rotationAngle > 0 ? 56 : 34;

  return {
    color: palette,
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: 14,
      right: 14,
      top: 24,
      bottom: bottomMargin,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories as string[],
      axisLine: {
        show: true,
        lineStyle: {
          color: tokens.axisBaseLineColor,
          width: 1,
        },
      },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        interval: 0,
        rotate: rotationAngle,
        overflow: 'truncate',
        width: 85,
        margin: 10,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: tokens.splitLineColor,
          type: 'dashed' as const,
          width: 1,
        },
      },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        barMaxWidth: 34,
        data: values as number[],
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const itemColor =
              colorMode === 'palette'
                ? palette[params.dataIndex % palette.length]!
                : color;
            if (colorMode === 'solid') {
              return itemColor;
            }
            return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: itemColor },
              { offset: 1, color: isDark ? hexToRgba(itemColor, 0.45) : hexToRgba(itemColor, 0.82) },
            ]);
          },
          borderRadius: [8, 8, 2, 2],
          shadowColor: isDark ? hexToRgba(color, 0.4) : hexToRgba(color, 0.28),
          shadowBlur: isDark ? 8 : 10,
          shadowOffsetY: isDark ? 2 : 4,
        },
      },
    ],
  };
}

/**
 * Modern Line Chart Options with smooth spline, grounded baseline, and soft gradient area.
 */
export function buildModernLineOption(
  categories: readonly string[],
  values: readonly number[],
  seriesName: string,
  isDark = false,
  accentColor?: string,
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);
  const lineColor = accentColor || (isDark ? '#A78BFA' : '#7C3AED');
  const hasLongLabels = categories.some((c) => (c || '').length > 8);
  const rotationAngle = categories.length > 5 || hasLongLabels ? 25 : 0;
  const bottomMargin = rotationAngle > 0 ? 56 : 34;

  return {
    color: [lineColor, ...tokens.palette],
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: 14,
      right: 14,
      top: 24,
      bottom: bottomMargin,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories as string[],
      axisLine: {
        show: true,
        lineStyle: {
          color: tokens.axisBaseLineColor,
          width: 1,
        },
      },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        interval: 0,
        rotate: rotationAngle,
        overflow: 'truncate',
        width: 85,
        margin: 10,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: tokens.splitLineColor,
          type: 'dashed' as const,
          width: 1,
        },
      },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        smooth: 0.38,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3.5,
          color: lineColor,
          shadowColor: isDark ? hexToRgba(lineColor, 0.55) : hexToRgba(lineColor, 0.42),
          shadowBlur: isDark ? 12 : 12,
          shadowOffsetY: isDark ? 4 : 6,
        },
        itemStyle: {
          color: isDark ? '#0f172a' : '#ffffff',
          borderColor: lineColor,
          borderWidth: 2.5,
          shadowColor: hexToRgba(lineColor, 0.4),
          shadowBlur: 6,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(lineColor, isDark ? 0.38 : 0.42) },
            { offset: 0.5, color: hexToRgba(lineColor, isDark ? 0.18 : 0.20) },
            { offset: 1, color: hexToRgba(lineColor, 0.02) },
          ]),
        },
        data: values as number[],
      },
    ],
  };
}

/**
 * Modern Donut Chart Options with padAngle, rounded corners, and curated palette.
 */
export function buildModernDonutOption(
  data: readonly { readonly name: string; readonly value: number }[],
  seriesName: string,
  isDark = false,
  accentColor?: string,
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);
  const palette = accentColor
    ? [accentColor, ...tokens.palette.filter((c) => c.toLowerCase() !== accentColor.toLowerCase())]
    : tokens.palette;

  return {
    color: [...palette],
    tooltip: getModernTooltip(tokens, 'item'),
    legend: {
      bottom: '1%',
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 14,
      textStyle: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
    },
    series: [
      {
        name: seriesName,
        type: 'pie',
        radius: ['46%', '74%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: false,
        padAngle: 4,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#0f172a' : '#ffffff',
          borderWidth: 3,
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.15)',
          shadowBlur: 10,
          shadowOffsetY: 4,
        },
        label: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold',
            color: tokens.tooltipText,
          },
        },
        data: data as { name: string; value: number }[],
      },
    ],
  };
}

/**
 * Modern Radial Gauge Option (Target Fulfillment, KPI speedometers)
 */
export function buildModernGaugeOption(
  value: number,
  goalValue = 100,
  metricName = 'Cumplimiento',
  isDark = false,
  accentColor = '#2563EB',
): echarts.EChartsOption {
  const percent = Math.min(100, Math.max(0, Math.round((value / (goalValue || 100)) * 100)));
  const tokens = getChartThemeTokens(isDark);

  return {
    tooltip: {
      formatter: `{a} <br/>{b} : ${value.toLocaleString()} / ${goalValue.toLocaleString()} ({c}%)`,
    },
    series: [
      {
        name: metricName,
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        center: ['50%', '55%'],
        radius: '88%',
        min: 0,
        max: 100,
        splitNumber: 5,
        itemStyle: {
          color: accentColor,
        },
        progress: {
          show: true,
          roundCap: true,
          width: 14,
          clip: true,
          itemStyle: {
            color: accentColor,
            shadowColor: isDark ? hexToRgba(accentColor, 0.5) : hexToRgba(accentColor, 0.35),
            shadowBlur: 10,
            shadowOffsetY: 3,
          },
        },
        pointer: {
          show: false,
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 14,
            color: [[1, isDark ? '#1e293b' : '#e2e8f0']],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '38%'],
          fontSize: 11,
          fontWeight: 600,
          color: tokens.axisLabelColor,
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '-4%'],
          fontSize: 28,
          fontWeight: 900,
          formatter: '{value}%',
          color: tokens.tooltipText,
        },
        data: [
          {
            value: percent,
            name: `${value.toLocaleString()} / ${goalValue.toLocaleString()}`,
          },
        ],
      },
    ],
  };
}

/**
 * Modern Funnel Conversion Chart (Drop-off analysis)
 */
export function buildModernFunnelOption(
  data: readonly { readonly name: string; readonly value: number }[],
  seriesName: string,
  isDark = false,
  accentColor?: string,
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);
  const palette = accentColor
    ? [accentColor, ...tokens.palette.filter((c) => c.toLowerCase() !== accentColor.toLowerCase())]
    : tokens.palette;

  return {
    color: [...palette],
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.tooltipBorder,
      textStyle: { color: tokens.tooltipText },
    },
    legend: {
      bottom: '1%',
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: tokens.axisLabelColor,
        fontSize: 11,
      },
    },
    series: [
      {
        name: seriesName,
        type: 'funnel',
        left: '8%',
        top: 16,
        bottom: 46,
        width: '84%',
        min: 0,
        max: Math.max(...data.map((d) => d.value), 100),
        minSize: '15%',
        maxSize: '100%',
        sort: 'descending',
        gap: 4,
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: 12,
          formatter: '{b}: {c}',
        },
        itemStyle: {
          borderColor: isDark ? '#0f172a' : '#ffffff',
          borderWidth: 2,
          borderRadius: 6,
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
        },
        data: data as { name: string; value: number }[],
      },
    ],
  };
}

/**
 * Modern Area Chart (Luminous gradient spline fill)
 */
export function buildModernAreaOption(
  categories: readonly string[],
  values: readonly number[],
  seriesName: string,
  isDark = false,
  accentColor?: string,
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);
  const color = accentColor || (isDark ? '#38BDF8' : '#0284C7');
  const hasLongLabels = categories.some((c) => (c || '').length > 8);
  const rotationAngle = categories.length > 5 || hasLongLabels ? 25 : 0;
  const bottomMargin = rotationAngle > 0 ? 56 : 34;

  return {
    color: [color],
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: 14,
      right: 14,
      top: 24,
      bottom: bottomMargin,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories as string[],
      axisLine: {
        show: true,
        lineStyle: { color: tokens.axisBaseLineColor },
      },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
        interval: 0,
        rotate: rotationAngle,
        overflow: 'truncate',
        width: 85,
        margin: 10,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: tokens.splitLineColor,
          type: 'dashed' as const,
          width: 1,
        },
      },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
      },
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        smooth: 0.38,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3.5,
          color: color,
          shadowColor: isDark ? hexToRgba(color, 0.55) : hexToRgba(color, 0.42),
          shadowBlur: 12,
          shadowOffsetY: 6,
        },
        itemStyle: {
          color: isDark ? '#0f172a' : '#ffffff',
          borderColor: color,
          borderWidth: 2.5,
          shadowColor: hexToRgba(color, 0.4),
          shadowBlur: 6,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, isDark ? 0.42 : 0.45) },
            { offset: 0.5, color: hexToRgba(color, isDark ? 0.20 : 0.22) },
            { offset: 1, color: hexToRgba(color, 0.02) },
          ]),
          opacity: 1,
        },
        data: values as number[],
      },
    ],
  };
}

/**
 * Modern Horizontal Bar Chart (Ranking without label clipping)
 */
export function buildModernHorizontalBarOption(
  categories: readonly string[],
  values: readonly number[],
  seriesName: string,
  isDark = false,
  accentColor?: string,
  colorMode: 'gradient' | 'palette' | 'solid' = 'gradient',
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);
  const color = accentColor || (isDark ? '#34D399' : '#059669');
  const palette = [color, ...tokens.palette.filter((c) => c.toLowerCase() !== color.toLowerCase())];

  return {
    color: palette,
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: 14,
      right: 32,
      top: 16,
      bottom: 16,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: {
          color: tokens.splitLineColor,
          type: 'dashed' as const,
          width: 1,
        },
      },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
      },
    },
    yAxis: {
      type: 'category',
      data: categories as string[],
      inverse: true,
      axisLine: {
        show: true,
        lineStyle: { color: tokens.axisBaseLineColor },
      },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
        fontWeight: 600,
        margin: 10,
        overflow: 'truncate',
        width: 105,
      },
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        barMaxWidth: 26,
        data: values as number[],
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          shadowColor: isDark ? hexToRgba(color, 0.4) : hexToRgba(color, 0.25),
          shadowBlur: 8,
          shadowOffsetX: 4,
          color: (params: { dataIndex: number }) => {
            const itemColor =
              colorMode === 'palette'
                ? palette[params.dataIndex % palette.length]!
                : color;
            return colorMode === 'solid'
              ? itemColor
              : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                  { offset: 0, color: itemColor },
                  { offset: 1, color: isDark ? hexToRgba(itemColor, 0.45) : hexToRgba(itemColor, 0.85) },
                ]);
          },
        },
        label: {
          show: true,
          position: 'right',
          color: tokens.axisLabelColor,
          fontSize: 11,
          fontWeight: 600,
        },
      },
    ],
  };
}

export type AccentColorName = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan';

export interface AccentColorPreset {
  readonly id: AccentColorName;
  readonly label: string;
  readonly hex: string;
  readonly borderClass: string;
  readonly bgSubtleClass: string;
}

export const ACCENT_COLOR_PRESETS: readonly AccentColorPreset[] = [
  {
    id: 'blue',
    label: 'Azul Océano',
    hex: '#2563EB',
    borderClass: 'border-blue-500/40',
    bgSubtleClass: 'bg-blue-500/5',
  },
  {
    id: 'emerald',
    label: 'Esmeralda',
    hex: '#059669',
    borderClass: 'border-emerald-500/40',
    bgSubtleClass: 'bg-emerald-500/5',
  },
  {
    id: 'violet',
    label: 'Violeta Real',
    hex: '#7C3AED',
    borderClass: 'border-violet-500/40',
    bgSubtleClass: 'bg-violet-500/5',
  },
  {
    id: 'amber',
    label: 'Ámbar Dorado',
    hex: '#D97706',
    borderClass: 'border-amber-500/40',
    bgSubtleClass: 'bg-amber-500/5',
  },
  {
    id: 'rose',
    label: 'Rosa Rubí',
    hex: '#E11D48',
    borderClass: 'border-rose-500/40',
    bgSubtleClass: 'bg-rose-500/5',
  },
  {
    id: 'cyan',
    label: 'Cian Nórdico',
    hex: '#0891B2',
    borderClass: 'border-cyan-500/40',
    bgSubtleClass: 'bg-cyan-500/5',
  },
] as const;

