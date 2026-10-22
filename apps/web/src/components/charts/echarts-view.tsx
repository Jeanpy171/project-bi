'use client';

import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

export interface EChartsViewProps {
  readonly options: echarts.EChartsOption;
  readonly height?: number | string;
  readonly className?: string;
}

export function EChartsView({ options, height = 300, className }: EChartsViewProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const initOrUpdateChart = () => {
    if (!chartRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');

    // If already initialized, dispose and re-init with correct theme
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
      renderer: 'canvas',
    });
    chartInstance.current = chart;

    const themeAdjustedOptions: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      textStyle: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: isDark ? '#94a3b8' : '#334155',
      },
      ...options,
    };

    chart.setOption(themeAdjustedOptions, true);
  };

  useEffect(() => {
    initOrUpdateChart();

    if (!chartRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    // Watch for dark mode changes on documentElement
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          initOrUpdateChart();
        }
      }
    });
    mutationObserver.observe(document.documentElement, { attributes: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current) {
      const isDark = document.documentElement.classList.contains('dark');
      chartInstance.current.setOption(
        {
          backgroundColor: 'transparent',
          textStyle: {
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: isDark ? '#94a3b8' : '#334155',
          },
          ...options,
        },
        true,
      );
    }
  }, [options]);

  return (
    <div
      ref={chartRef}
      className={className}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}
