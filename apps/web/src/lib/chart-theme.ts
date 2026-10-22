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
    splitLineColor: isDark ? 'rgba(51, 65, 85, 0.45)' : '#e2e8f0',
    axisLabelColor: isDark ? '#e2e8f0' : '#334155', // High contrast slate-200 in dark, slate-700 in light
    pointerColor: isDark ? '#475569' : '#94a3b8',
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

/**
 * Modern Bar Chart Options with subtle dashed grid, rounded bars, and zero heavy black axis lines.
 */
export function buildModernBarOption(
  categories: readonly string[],
  values: readonly number[],
  seriesName: string,
  isDark = false,
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);

  return {
    color: [...tokens.palette],
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: '2%',
      right: '2%',
      top: '12%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories as string[],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 12,
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
          type: 'dashed',
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
        barMaxWidth: 36,
        data: values as number[],
        itemStyle: {
          color: isDark
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#60A5FA' },
                { offset: 1, color: '#2563EB' },
              ])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#3B82F6' },
                { offset: 1, color: '#1D4ED8' },
              ]),
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  };
}

/**
 * Modern Line Chart Options with smooth spline and soft gradient area.
 */
export function buildModernLineOption(
  categories: readonly string[],
  values: readonly number[],
  seriesName: string,
  isDark = false,
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);
  const lineColor = isDark ? '#A78BFA' : '#7C3AED';

  return {
    color: [...tokens.palette],
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: '2%',
      right: '2%',
      top: '12%',
      bottom: '6%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories as string[],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 12,
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
          type: 'dashed',
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
        smooth: 0.35,
        showSymbol: false,
        symbolSize: 6,
        lineStyle: {
          width: 2.5,
          color: lineColor,
        },
        itemStyle: {
          color: lineColor,
        },
        areaStyle: {
          color: isDark
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(167, 139, 250, 0.28)' },
                { offset: 1, color: 'rgba(167, 139, 250, 0.00)' },
              ])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(124, 58, 237, 0.20)' },
                { offset: 1, color: 'rgba(124, 58, 237, 0.00)' },
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
): echarts.EChartsOption {
  const tokens = getChartThemeTokens(isDark);

  return {
    color: [...tokens.palette],
    tooltip: getModernTooltip(tokens, 'item'),
    legend: {
      bottom: '2%',
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
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
        radius: ['56%', '78%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        padAngle: 3,
        itemStyle: {
          borderRadius: 6,
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
