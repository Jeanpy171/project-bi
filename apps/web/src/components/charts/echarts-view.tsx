'use client';

import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

export interface EChartsViewProps {
  readonly options: echarts.EChartsOption;
  readonly isDarkMode?: boolean;
  readonly height?: number | string;
  readonly className?: string;
}

export function EChartsView({
  options,
  isDarkMode = false,
  height = 300,
  className,
}: EChartsViewProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Initialize or re-create chart whenever the theme mode changes
  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose existing instance to completely clean out old theme cache
    if (chartInstance.current) {
      chartInstance.current.dispose();
      chartInstance.current = null;
    }

    const chart = echarts.init(chartRef.current, isDarkMode ? 'dark' : undefined, {
      renderer: 'canvas',
    });
    chartInstance.current = chart;

    const themeAdjustedOptions: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      ...options,
    };

    chart.setOption(themeAdjustedOptions, true);

    let rafId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        chart.resize({
          animation: {
            duration: 300,
            easing: 'cubicOut',
          },
        });
      });
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      chart.dispose();
      chartInstance.current = null;
    };
  }, [isDarkMode]);

  // Update chart options smoothly when options change
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(
        {
          backgroundColor: 'transparent',
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
