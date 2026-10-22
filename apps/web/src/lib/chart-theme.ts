import * as echarts from 'echarts';

/**
 * Curated Metabase / Stripe SaaS BI Color Palette
 * Zero tacky default colors; elegant, accessible, high-contrast in light mode.
 */
export const SAAS_PALETTE = [
  '#3B82F6', // Modern Blue
  '#10B981', // Emerald Teal
  '#8B5CF6', // Soft Violet
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EC4899', // Pink Rose
  '#6366F1', // Indigo
  '#14B8A6', // Teal
] as const;

export interface ChartThemeTokens {
  readonly isDark: boolean;
  readonly splitLineColor: string;
  readonly axisLabelColor: string;
  readonly tooltipBg: string;
  readonly tooltipBorder: string;
  readonly tooltipText: string;
}

export function getChartThemeTokens(isDark: boolean): ChartThemeTokens {
  return {
    isDark,
    splitLineColor: isDark ? '#1e293b' : '#f1f5f9',
    axisLabelColor: isDark ? '#94a3b8' : '#64748b',
    tooltipBg: isDark ? '#0f172a' : '#ffffff',
    tooltipBorder: isDark ? '#334155' : '#e2e8f0',
    tooltipText: isDark ? '#f8fafc' : '#0f172a',
  };
}

/**
 * Common modern tooltip with shadow, rounded corners, and crisp typography.
 */
export function getModernTooltip(tokens: ChartThemeTokens, trigger: 'axis' | 'item' = 'axis') {
  return {
    trigger,
    backgroundColor: tokens.tooltipBg,
    borderColor: tokens.tooltipBorder,
    borderWidth: 1,
    padding: [10, 14],
    textStyle: {
      color: tokens.tooltipText,
      fontSize: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 500,
    },
    extraCssText:
      'box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border-radius: 10px;',
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
    color: [...SAAS_PALETTE],
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: '2%',
      right: '2%',
      top: '12%',
      bottom: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories as string[],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
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
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3B82F6' },
            { offset: 1, color: '#2563EB' },
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

  return {
    color: [...SAAS_PALETTE],
    tooltip: getModernTooltip(tokens, 'axis'),
    grid: {
      left: '2%',
      right: '2%',
      top: '12%',
      bottom: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories as string[],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: tokens.axisLabelColor,
        fontSize: 11,
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
          color: '#8B5CF6',
        },
        itemStyle: {
          color: '#8B5CF6',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.22)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.00)' },
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
    color: [...SAAS_PALETTE],
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
        fontWeight: 500,
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
