'use client';

import { useEffect, useMemo, useState } from 'react';
import { type GridCardItem, renderCardBadge } from './dashboard-canvas';
import { EChartsView } from '../charts/echarts-view';
import { FinancialStatementCard } from '../financial/financial-statement-card';
import {
  buildModernAreaOption,
  buildModernBarOption,
  buildModernDonutOption,
  buildModernFunnelOption,
  buildModernGaugeOption,
  buildModernLineOption,
} from '../../lib/chart-theme';
import {
  Check,
  Copy,
  Download,
  FileCode,
  Minimize2,
  TrendingUp,
} from 'lucide-react';

interface CardExpandModalProps {
  readonly card: GridCardItem | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isDarkMode: boolean;
}

export function CardExpandModal({
  card,
  isOpen,
  onClose,
  isDarkMode,
}: CardExpandModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeCard, setActiveCard] = useState<GridCardItem | null>(card);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (card) {
      setActiveCard(card);
    }
  }, [card]);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const resolvedChartOption = useMemo(() => {
    if (!activeCard) return {};
    if (activeCard.echartsOption && Object.keys(activeCard.echartsOption).length > 0) {
      return activeCard.echartsOption;
    }

    switch (activeCard.chartKind) {
      case 'donut':
        return buildModernDonutOption(
          [
            { name: 'Ecuador', value: 1048 },
            { name: 'Argentina', value: 735 },
            { name: 'Colombia', value: 580 },
            { name: 'Chile', value: 484 },
          ],
          activeCard.title || 'Distribución',
          isDarkMode,
          activeCard.accentColor,
        );

      case 'line':
        return buildModernLineOption(
          ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
          [1200, 2400, 3100, 4800],
          activeCard.title || 'Ingresos',
          isDarkMode,
          activeCard.accentColor,
        );

      case 'area':
        return buildModernAreaOption(
          ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
          [1200, 2400, 3100, 4800],
          activeCard.title || 'Tendencia',
          isDarkMode,
          activeCard.accentColor,
        );

      case 'gauge':
        return buildModernGaugeOption(
          activeCard.summaryValue
            ? parseFloat(activeCard.summaryValue.replace(/[^0-9.]/g, '')) || 78
            : 78,
          activeCard.goalValue || 100,
          activeCard.title || 'Cumplimiento',
          isDarkMode,
          activeCard.accentColor || '#2563EB',
        );

      case 'funnel':
        return buildModernFunnelOption(
          [
            { name: 'Visitas', value: 12500 },
            { name: 'Leads', value: 4200 },
            { name: 'Oportunidades', value: 1850 },
            { name: 'Ventas', value: 680 },
          ],
          activeCard.title || 'Conversión',
          isDarkMode,
          activeCard.accentColor,
        );

      case 'bar_grouped':
      case 'bar_horizontal':
      default:
        return buildModernBarOption(
          ['Tecnología', 'Oficina', 'Servicios', 'Consultoría'],
          [4250, 1820, 2950, 1400],
          activeCard.title || 'Ventas 2026',
          isDarkMode,
          activeCard.accentColor,
          activeCard.colorMode || 'gradient',
        );
    }
  }, [activeCard, isDarkMode]);

  if (!isMounted || !activeCard) return null;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(
      {
        id: activeCard.id,
        title: activeCard.title,
        subtitle: activeCard.subtitle,
        chartKind: activeCard.chartKind,
        summaryValue: activeCard.summaryValue,
        trendText: activeCard.trendText,
        source: activeCard.sourceName,
        table: activeCard.tableName,
      },
      null,
      2,
    );
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    const canvas = document.querySelector('.card-expand-container canvas') as HTMLCanvasElement | null;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeCard.title.toLowerCase().replace(/\s+/g, '_')}_bi_export.png`;
      a.click();
    } else {
      window.print();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div
        className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-surface/95 backdrop-blur-2xl border border-surface-border/90 rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden card-expand-container transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ring-1 ring-white/10 ${
          isVisible
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border/80 shrink-0 bg-surface/80">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-foreground tracking-tight truncate">
                  {activeCard.title}
                </h2>
                {renderCardBadge(activeCard)}
              </div>
              {activeCard.subtitle && (
                <p
                  style={activeCard.subtitleFontSize ? { fontSize: `${activeCard.subtitleFontSize}px` } : undefined}
                  className="text-xs text-muted mt-0.5 truncate"
                >
                  {activeCard.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              title="Copiar datos en formato JSON"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-success font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted" />
                  <span>Copiar JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              title="Descargar imagen PNG de la métrica"
            >
              <Download className="h-3.5 w-3.5 text-muted" />
              <span>Exportar PNG</span>
            </button>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-subtle transition-all duration-200 hover:scale-110 active:scale-90 ml-1 border border-surface-border bg-surface shadow-sm"
              title="Cerrar vista expandida (Esc)"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: High Resolution Large View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeCard.chartKind === 'kpi' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-5 bg-surface-subtle/50 rounded-3xl border border-surface-border">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">
                Métrica Consolidada en Tiempo Real
              </span>
              <div className="text-7xl font-black text-foreground tracking-tight font-mono">
                {activeCard.summaryValue}
              </div>
              {activeCard.trendText && (
                <div className="flex items-center gap-2 text-base text-success font-bold bg-success/10 px-5 py-2 rounded-full border border-success/20 shadow-sm">
                  <TrendingUp className="h-5 w-5" />
                  <span>{activeCard.trendText}</span>
                </div>
              )}
            </div>
          )}

          {activeCard.chartKind !== 'kpi' &&
            activeCard.chartKind !== 'plan_cuentas' &&
            activeCard.chartKind !== 'financial_statement' &&
            activeCard.chartKind !== 'section_header' && (
            <div className="w-full">
              <EChartsView
                isDarkMode={isDarkMode}
                options={resolvedChartOption}
                height={520}
              />
            </div>
          )}

          {(activeCard.chartKind === 'plan_cuentas' ||
            activeCard.chartKind === 'financial_statement' ||
            activeCard.chartKind === 'table_hierarchical') && (
            <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white dark:bg-slate-950 p-4 shadow-sm">
              <FinancialStatementCard
                initialData={activeCard.financialData}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* Source & Metadata Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted pt-4 border-t border-surface-border">
            <div className="flex items-center gap-1.5">
              <FileCode className="h-4 w-4" />
              <span>
                Identificador: <span className="font-mono text-foreground">{activeCard.id}</span>
              </span>
            </div>
            <span>Tipo: {activeCard.chartKind}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
