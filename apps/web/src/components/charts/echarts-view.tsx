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

  useEffect(() => {
    if (!chartRef.current) return;

    // Check dark mode
    const isDark = document.documentElement.classList.contains('dark');
    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
      renderer: 'canvas',
    });
    chartInstance.current = chart;

    chart.setOption({
      backgroundColor: 'transparent',
      ...options,
    });

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartInstance.current = null;
    };
  }, []);

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
