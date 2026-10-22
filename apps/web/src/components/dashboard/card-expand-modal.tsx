'use client';

import { useEffect, useState } from 'react';
import type { GridCardItem } from './dashboard-canvas';
import { EChartsView } from '../charts/echarts-view';
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !card) return null;

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(
      {
        id: card.id,
        title: card.title,
        subtitle: card.subtitle,
        chartKind: card.chartKind,
        summaryValue: card.summaryValue,
        trendText: card.trendText,
        source: card.sourceName,
        table: card.tableName,
      },
      null,
      2,
    );
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    // Find the canvas inside the modal and trigger download
    const canvas = document.querySelector('.card-expand-container canvas') as HTMLCanvasElement | null;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${card.title.toLowerCase().replace(/\s+/g, '_')}_bi_export.png`;
      a.click();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden card-expand-container">
        {/* Accent Bar if custom color */}
        {card.customColor && (
          <div
            className="h-1.5 w-full shrink-0"
            style={{ backgroundColor: card.customColor }}
          />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {card.title}
                </h2>
                {card.badge && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={
                      card.customColor
                        ? {
                            backgroundColor: `${card.customColor}18`,
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
                <p className="text-xs text-muted mt-0.5">{card.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all"
              title="Descargar imagen PNG de la métrica"
            >
              <Download className="h-3.5 w-3.5 text-muted" />
              <span>Exportar PNG</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-subtle transition-all ml-1"
              title="Cerrar vista expandida (Esc)"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Large View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {card.chartKind === 'kpi' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-surface-subtle/50 rounded-2xl border border-surface-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Valor Actual Registrado
              </span>
              <div className="text-6xl font-black text-foreground tracking-tight font-mono">
                {card.summaryValue}
              </div>
              {card.trendText && (
                <div className="flex items-center gap-2 text-base text-success font-bold bg-success/10 px-4 py-1.5 rounded-full border border-success/20">
                  <TrendingUp className="h-5 w-5" />
                  <span>{card.trendText}</span>
                </div>
              )}
            </div>
          )}

          {card.chartKind === 'bar_grouped' && card.echartsOption && (
            <div className="w-full">
              <EChartsView
                isDarkMode={isDarkMode}
                options={card.echartsOption}
                height={520}
              />
            </div>
          )}

          {card.chartKind === 'donut' && card.echartsOption && (
            <div className="w-full">
              <EChartsView
                isDarkMode={isDarkMode}
                options={card.echartsOption}
                height={520}
              />
            </div>
          )}

          {card.chartKind === 'line' && card.echartsOption && (
            <div className="w-full">
              <EChartsView
                isDarkMode={isDarkMode}
                options={card.echartsOption}
                height={520}
              />
            </div>
          )}

          {card.chartKind === 'plan_cuentas' && (
            <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-surface-border text-foreground font-semibold bg-surface-subtle">
                  <tr>
                    <th className="py-3 px-4">Código Contable</th>
                    <th className="py-3 px-4">Nombre de Cuenta</th>
                    <th className="py-3 px-4">Clasificación</th>
                    <th className="py-3 px-4 text-right">Balance Registrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  <tr className="font-bold text-foreground bg-surface-subtle/40">
                    <td className="py-2.5 px-4">1</td>
                    <td className="py-2.5 px-4">ACTIVO TOTAL</td>
                    <td className="py-2.5 px-4">Activo</td>
                    <td className="py-2.5 px-4 text-right font-mono">$625,000.00</td>
                  </tr>
                  <tr className="font-semibold text-foreground">
                    <td className="py-2.5 px-4 pl-8">11</td>
                    <td className="py-2.5 px-4">Activo Corriente</td>
                    <td className="py-2.5 px-4">Activo</td>
                    <td className="py-2.5 px-4 text-right font-mono">$385,000.00</td>
                  </tr>
                  <tr className="text-muted">
                    <td className="py-2.5 px-4 pl-12">111</td>
                    <td className="py-2.5 px-4">Disponible en Bancos</td>
                    <td className="py-2.5 px-4">Activo</td>
                    <td className="py-2.5 px-4 text-right font-mono">$165,000.00</td>
                  </tr>
                  <tr className="text-muted">
                    <td className="py-2.5 px-4 pl-16">11101</td>
                    <td className="py-2.5 px-4">Caja General</td>
                    <td className="py-2.5 px-4">Activo</td>
                    <td className="py-2.5 px-4 text-right font-mono">$25,000.00</td>
                  </tr>
                  <tr className="text-muted">
                    <td className="py-2.5 px-4 pl-16">11102</td>
                    <td className="py-2.5 px-4">Bancos Nacionales</td>
                    <td className="py-2.5 px-4">Activo</td>
                    <td className="py-2.5 px-4 text-right font-mono">$140,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Source & Metadata Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted pt-4 border-t border-surface-border">
            <div className="flex items-center gap-1.5">
              <FileCode className="h-4 w-4" />
              <span>
                Identificador: <span className="font-mono text-foreground">{card.id}</span>
              </span>
            </div>
            <span>Tipo: {card.chartKind}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
