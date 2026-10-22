'use client';

import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Check,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Layout,
  Maximize2,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import type { GridCardItem } from './dashboard-canvas';

interface ExportPdfModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dashboardTitle: string;
  readonly dashboardDescription?: string;
  readonly targetElement: HTMLElement | null;
  readonly cards: readonly GridCardItem[];
}

export type PaperTheme = 'clean_white' | 'contrast_slate' | 'executive_dark';
export type PageDistribution = 'fit_one_page' | 'sections_two_pages';

export function ExportPdfModal({
  isOpen,
  onClose,
  dashboardTitle,
  dashboardDescription,
  targetElement,
  cards,
}: ExportPdfModalProps) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [pageDistribution, setPageDistribution] = useState<PageDistribution>('fit_one_page');
  const [paperTheme, setPaperTheme] = useState<PaperTheme>('clean_white');
  const [activePreviewPage, setActivePreviewPage] = useState<1 | 2>(1);
  const [includeExecutiveHeader, setIncludeExecutiveHeader] = useState(true);
  const [includeFooterConfidential, setIncludeFooterConfidential] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  // Keep active preview page valid when changing distribution
  useEffect(() => {
    if (pageDistribution === 'fit_one_page') {
      setActivePreviewPage(1);
    }
  }, [pageDistribution]);

  const totalPages = pageDistribution === 'fit_one_page' ? 1 : 2;

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const kpiCards = useMemo(() => cards.filter((c) => c.chartKind === 'kpi'), [cards]);
  const chartCards = useMemo(
    () => cards.filter((c) => c.chartKind !== 'kpi' && c.chartKind !== 'section_header'),
    [cards],
  );

  if (!isOpen) return null;

  // Background and border tokens based on selected paperTheme
  const getThemePalette = (theme: PaperTheme) => {
    switch (theme) {
      case 'contrast_slate':
        return {
          bgHex: '#f1f5f9',
          cardBgHex: '#ffffff',
          borderHex: '#cbd5e1',
          textHex: '#0f172a',
          mutedHex: '#64748b',
          headerBgHex: '#e2e8f0',
        };
      case 'executive_dark':
        return {
          bgHex: '#0f172a',
          cardBgHex: '#1e293b',
          borderHex: '#334155',
          textHex: '#f8fafc',
          mutedHex: '#94a3b8',
          headerBgHex: '#1e293b',
        };
      case 'clean_white':
      default:
        return {
          bgHex: '#ffffff',
          cardBgHex: '#ffffff',
          borderHex: '#cbd5e1',
          textHex: '#0f172a',
          mutedHex: '#64748b',
          headerBgHex: '#f8fafc',
        };
    }
  };

  const handleDownloadPdf = async () => {
    if (!targetElement) return;

    try {
      setIsExporting(true);
      setDownloadSuccess(false);
      setExportProgress('Preparando lienzos ejecutivos y escalado A4...');

      const palette = getThemePalette(paperTheme);
      const pageWidth = orientation === 'landscape' ? 297 : 210;
      const pageHeight = orientation === 'landscape' ? 210 : 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const headerHeight = includeExecutiveHeader ? 20 : 0;
      const footerHeight = includeFooterConfidential ? 10 : 4;
      const availableHeight = pageHeight - margin * 2 - headerHeight - footerHeight;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      // Executive Brand Header Renderer
      const drawHeader = (doc: jsPDF, pageNum: number, totalDocPages: number) => {
        doc.setFillColor(palette.headerBgHex);
        doc.rect(0, 0, pageWidth, 18, 'F');
        doc.setDrawColor(palette.borderHex);
        doc.line(0, 18, pageWidth, 18);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(palette.textHex);
        doc.text(dashboardTitle, margin, 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(palette.mutedHex);
        const dateStr = new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        doc.text(
          `Proyecto BI • Reporte Ejecutivo | Corte: ${dateStr} • ${cards.length} tarjetas analizadas • Pág. ${pageNum}/${totalDocPages}`,
          margin,
          14,
        );
      };

      // Confidential Footer Renderer
      const drawFooter = (doc: jsPDF, pageNum: number, totalDocPages: number) => {
        if (!includeFooterConfidential) return;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(palette.mutedHex);
        doc.text(
          `Documento confidencial generado por Proyecto BI • Página ${pageNum} de ${totalDocPages}`,
          pageWidth / 2,
          pageHeight - 4,
          { align: 'center' },
        );
      };

      const captureWidth = orientation === 'landscape' ? 1120 : 800;

      if (pageDistribution === 'fit_one_page') {
        // =========================================================
        // MODE 1: FIT TO 1 SINGLE A4 SHEET (Exactamente 1 Hoja A4)
        // =========================================================
        setExportProgress('Renderizando tablero acoplado en 1 página A4 sin cortes...');

        const canvas = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: palette.bgHex,
          windowWidth: captureWidth,
          onclone: (_clonedDoc, clonedEl) => {
            clonedEl.style.width = `${captureWidth}px`;
            clonedEl.style.padding = '0';
            clonedEl.style.margin = '0';
            clonedEl.style.backgroundColor = palette.bgHex;

            // Apply contrast styling to all executive cards
            const cardElements = clonedEl.querySelectorAll('.card-executive');
            cardElements.forEach((c) => {
              const el = c as HTMLElement;
              el.style.backgroundColor = palette.cardBgHex;
              el.style.borderColor = palette.borderHex;
              el.style.color = palette.textHex;
              if (paperTheme === 'contrast_slate') {
                el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
              } else if (paperTheme === 'clean_white') {
                el.style.boxShadow = 'none';
              }
            });
          },
        });

        // Compute proportional scale factor to fit within exactly 1 single A4 page
        const scaleX = contentWidth / canvas.width;
        const scaleY = availableHeight / canvas.height;
        const scale = Math.min(scaleX, scaleY);

        const renderWidth = canvas.width * scale;
        const renderHeight = canvas.height * scale;
        const offsetX = margin + (contentWidth - renderWidth) / 2;
        const offsetY = margin + (includeExecutiveHeader ? headerHeight : 0);

        if (includeExecutiveHeader) {
          drawHeader(pdf, 1, 1);
        }

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', offsetX, offsetY, renderWidth, renderHeight);

        if (includeFooterConfidential) {
          drawFooter(pdf, 1, 1);
        }
      } else {
        // =========================================================
        // MODE 2: EXTENDED PAGINATED REPORT (2 Hojas A4 por Secciones)
        // =========================================================
        setExportProgress('Generando Hoja 1 de 2 (Métricas Principales & KPIs)...');

        // Capture Page 1: Hide lower half (charts & tables after section 2)
        const canvasPage1 = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: palette.bgHex,
          windowWidth: captureWidth,
          onclone: (_clonedDoc, clonedEl) => {
            clonedEl.style.width = `${captureWidth}px`;
            clonedEl.style.padding = '0';
            clonedEl.style.margin = '0';
            clonedEl.style.backgroundColor = palette.bgHex;

            // Show section 1, hide detailed table cards for page 1
            const cardElements = Array.from(clonedEl.querySelectorAll('.card-executive')) as HTMLElement[];
            cardElements.forEach((el, index) => {
              el.style.backgroundColor = palette.cardBgHex;
              el.style.borderColor = palette.borderHex;
              el.style.color = palette.textHex;
              // Hide last 3 cards on page 1 so page 1 is dedicated to KPIs and primary charts
              if (index >= 6) {
                el.style.display = 'none';
              }
            });
          },
        });

        setExportProgress('Generando Hoja 2 de 2 (Tablas de Detalle & Análisis Extendido)...');

        // Capture Page 2: Hide upper half (KPIs), show detailed charts and tables
        const canvasPage2 = await html2canvas(targetElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: palette.bgHex,
          windowWidth: captureWidth,
          onclone: (_clonedDoc, clonedEl) => {
            clonedEl.style.width = `${captureWidth}px`;
            clonedEl.style.padding = '0';
            clonedEl.style.margin = '0';
            clonedEl.style.backgroundColor = palette.bgHex;

            // Hide section 1 KPI cards for page 2
            const cardElements = Array.from(clonedEl.querySelectorAll('.card-executive')) as HTMLElement[];
            cardElements.forEach((el, index) => {
              el.style.backgroundColor = palette.cardBgHex;
              el.style.borderColor = palette.borderHex;
              el.style.color = palette.textHex;
              // Keep first section header hidden, show remaining cards
              if (index < 5) {
                el.style.display = 'none';
              }
            });
          },
        });

        // Add Page 1 to PDF
        if (includeExecutiveHeader) drawHeader(pdf, 1, 2);
        const scale1 = Math.min(contentWidth / canvasPage1.width, availableHeight / canvasPage1.height);
        const w1 = canvasPage1.width * scale1;
        const h1 = canvasPage1.height * scale1;
        const offX1 = margin + (contentWidth - w1) / 2;
        const offY1 = margin + (includeExecutiveHeader ? headerHeight : 0);
        pdf.addImage(canvasPage1.toDataURL('image/png'), 'PNG', offX1, offY1, w1, h1);
        if (includeFooterConfidential) drawFooter(pdf, 1, 2);

        // Add Page 2 to PDF
        pdf.addPage();
        if (includeExecutiveHeader) drawHeader(pdf, 2, 2);
        const scale2 = Math.min(contentWidth / canvasPage2.width, availableHeight / canvasPage2.height);
        const w2 = canvasPage2.width * scale2;
        const h2 = canvasPage2.height * scale2;
        const offX2 = margin + (contentWidth - w2) / 2;
        const offY2 = margin + (includeExecutiveHeader ? headerHeight : 0);
        pdf.addImage(canvasPage2.toDataURL('image/png'), 'PNG', offX2, offY2, w2, h2);
        if (includeFooterConfidential) drawFooter(pdf, 2, 2);
      }

      setExportProgress('Finalizando compilación y descarga...');

      const dateCode = new Date().toISOString().slice(0, 10);
      const safeTitle = dashboardTitle.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Reporte_${safeTitle}_${dateCode}.pdf`;

      pdf.save(filename);

      setDownloadSuccess(true);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress('');
      }, 1500);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setIsExporting(false);
      setExportProgress('Error al generar el PDF. Por favor intentá nuevamente.');
    }
  };

  const handleCleanPrint = () => {
    onClose();
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-foreground">Exportar Tablero en PDF</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  📄 {totalPages} {totalPages === 1 ? 'Página A4' : 'Páginas A4'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ⚡ Previsualización en Vivo
                </span>
              </div>
              <p className="text-xs text-muted">
                Configurá el formato del reporte y observá en tiempo real cómo cambia la hoja A4 antes de descargar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-subtle transition-all disabled:opacity-50 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Main Body: 2 Columns on Desktop */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row min-h-0 bg-surface divide-y md:divide-y-0 md:divide-x divide-surface-border">
          {/* Left Column: Configuration Controls (w-96) */}
          <div className="w-full md:w-[380px] p-5 space-y-4 shrink-0 overflow-y-auto">
            {/* Target Dashboard Context */}
            <div className="p-3.5 rounded-xl border border-surface-border bg-surface-subtle/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Tablero Seleccionado
                </span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {cards.length} tarjetas
                </span>
              </div>
              <h3 className="text-xs font-bold text-foreground truncate">{dashboardTitle}</h3>
              {dashboardDescription && (
                <p className="text-[11px] text-muted line-clamp-1">{dashboardDescription}</p>
              )}
            </div>

            {/* Option 1: Page Distribution (Fit 1 Page vs 2 Pages) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-primary" />
                  Distribución y Hojas de Salida
                </label>
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {totalPages} {totalPages === 1 ? 'Hoja' : 'Hojas'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPageDistribution('fit_one_page')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    pageDistribution === 'fit_one_page'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:bg-surface-subtle/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Ajustar a 1 Hoja</span>
                    {pageDistribution === 'fit_one_page' && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted block mt-0.5 font-medium">
                    Resumen Ejecutivo (One-Pager)
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    ★ Todo el tablero acoplado
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPageDistribution('sections_two_pages')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    pageDistribution === 'sections_two_pages'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:bg-surface-subtle/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">2 Hojas A4</span>
                    {pageDistribution === 'sections_two_pages' && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted block mt-0.5 font-medium">
                    Paginado por Secciones
                  </span>
                  <span className="text-[9px] text-muted mt-1 block">KPIs + Detalle tablas</span>
                </button>
              </div>
            </div>

            {/* Option 2: Page Orientation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Layout className="h-3.5 w-3.5 text-primary" />
                Orientación de Página
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    orientation === 'landscape'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:bg-surface-subtle/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Horizontal</span>
                    {orientation === 'landscape' && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted block mt-0.5 font-medium">
                    Landscape (297 × 210 mm)
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    ★ Recomendado
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    orientation === 'portrait'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:bg-surface-subtle/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">Vertical</span>
                    {orientation === 'portrait' && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted block mt-0.5 font-medium">
                    Portrait (210 × 297 mm)
                  </span>
                  <span className="text-[9px] text-muted mt-1 block">Formato informe</span>
                </button>
              </div>
            </div>

            {/* Option 3: Distinct High-Contrast Themes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Contraste del Fondo
                </span>
                <span className="text-[10px] font-medium text-muted">Impacto visual claro</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperTheme('clean_white')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    paperTheme === 'clean_white'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:bg-surface-subtle'
                  }`}
                >
                  <div className="h-4 w-4 rounded-full border border-slate-300 bg-white shadow-2xs" />
                  <span className="text-[11px] font-bold text-foreground leading-tight">Blanco Puro</span>
                  <span className="text-[9px] text-muted">Impresión</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperTheme('contrast_slate')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    paperTheme === 'contrast_slate'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:bg-surface-subtle'
                  }`}
                >
                  <div className="h-4 w-4 rounded-full border border-slate-300 bg-slate-200 shadow-2xs" />
                  <span className="text-[11px] font-bold text-foreground leading-tight">Gris Ejecutivo</span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Contraste ★</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaperTheme('executive_dark')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    paperTheme === 'executive_dark'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
                      : 'border-surface-border bg-surface hover:bg-surface-subtle'
                  }`}
                >
                  <div className="h-4 w-4 rounded-full border border-slate-600 bg-slate-900 shadow-2xs" />
                  <span className="text-[11px] font-bold text-foreground leading-tight">Pizarra Dark</span>
                  <span className="text-[9px] text-muted">Digital</span>
                </button>
              </div>
            </div>

            {/* Option 4: Executive Header & Footer Toggles */}
            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl border border-surface-border bg-surface flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Membrete y Encabezado
                  </span>
                  <span className="text-[10px] text-muted">
                    Banda ejecutiva institucional con fecha y foliado
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeExecutiveHeader}
                  onChange={(e) => setIncludeExecutiveHeader(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-border text-primary focus:ring-primary cursor-pointer shrink-0"
                />
              </div>

              <div className="p-3 rounded-xl border border-surface-border bg-surface flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Pie de Página y Foliado
                  </span>
                  <span className="text-[10px] text-muted">
                    Sello de confidencialidad y número de hoja
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={includeFooterConfidential}
                  onChange={(e) => setIncludeFooterConfidential(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-border text-primary focus:ring-primary cursor-pointer shrink-0"
                />
              </div>
            </div>

            {/* Progress / Status Notice */}
            {isExporting && (
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-2.5 animate-in fade-in">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs font-semibold text-primary">{exportProgress}</span>
              </div>
            )}

            {downloadSuccess && (
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-xs font-bold">¡PDF descargado con éxito!</span>
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive A4 Document Preview */}
          <div className="flex-1 p-5 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
            {/* Live Indicator Pills and Page Switcher */}
            <div className="w-full flex items-center justify-between mb-3 px-1 text-[11px] text-muted">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Vista previa de la hoja de exportación
              </span>

              <div className="flex items-center gap-2">
                {totalPages > 1 && (
                  <div className="flex items-center bg-surface border border-surface-border rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setActivePreviewPage(1)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        activePreviewPage === 1
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Hoja 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewPage(2)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        activePreviewPage === 2
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted hover:text-foreground'
                      }`}
                    >
                      Hoja 2
                    </button>
                  </div>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface border border-surface-border text-foreground shadow-xs">
                  {orientation === 'landscape'
                    ? `A4 Horizontal • Pág. ${activePreviewPage}/${totalPages}`
                    : `A4 Vertical • Pág. ${activePreviewPage}/${totalPages}`}
                </span>
              </div>
            </div>

            {/* The A4 Interactive Document Sheet */}
            <div className="w-full flex-1 flex items-center justify-center p-2 overflow-hidden">
              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl rounded-lg border overflow-hidden flex flex-col justify-between ${
                  paperTheme === 'clean_white'
                    ? 'bg-white text-slate-900 border-slate-300'
                    : paperTheme === 'contrast_slate'
                    ? 'bg-slate-100 text-slate-900 border-slate-300 ring-1 ring-slate-400/20'
                    : 'bg-slate-950 text-slate-100 border-slate-800'
                } ${
                  orientation === 'landscape'
                    ? 'w-full max-w-[500px] aspect-[1.414/1]'
                    : 'w-[280px] sm:w-[320px] aspect-[1/1.414]'
                }`}
              >
                {/* Simulated Executive Header */}
                {includeExecutiveHeader ? (
                  <div
                    className={`p-3 border-b shrink-0 transition-all duration-200 ${
                      paperTheme === 'executive_dark'
                        ? 'bg-slate-900/90 border-slate-800 text-slate-100'
                        : paperTheme === 'contrast_slate'
                        ? 'bg-slate-200/90 border-slate-300 text-slate-900'
                        : 'bg-slate-50/90 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded bg-blue-600 text-white font-bold text-[8px] flex items-center justify-center">
                          BI
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider">
                          Proyecto BI • Reporte Ejecutivo
                        </span>
                      </div>
                      <span className="text-[8px] font-mono opacity-60">
                        {currentDateFormatted}
                      </span>
                    </div>

                    <h4 className="text-[10px] font-black mt-1 truncate">
                      {dashboardTitle}
                    </h4>

                    <div className="flex items-center gap-2 mt-0.5 text-[7px] opacity-70 font-medium">
                      <span>• Formato: {pageDistribution === 'fit_one_page' ? 'Hoja Única Acoplada' : 'Paginado 2 Hojas'}</span>
                      <span>• {kpiCards.length} KPIs</span>
                      <span>• {chartCards.length} Gráficos</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 pt-3 shrink-0">
                    <h4 className="text-[10px] font-black truncate">
                      {dashboardTitle}
                    </h4>
                  </div>
                )}

                {/* Simulated Dashboard Cards Content Preview */}
                <div className="flex-1 p-3 overflow-hidden flex flex-col justify-start gap-2">
                  {/* PAGE 1 CONTENT (or FIT-ONE-PAGE) */}
                  {(pageDistribution === 'fit_one_page' || activePreviewPage === 1) && (
                    <>
                      {/* KPI Row Preview */}
                      <div className="grid grid-cols-4 gap-1.5">
                        <div
                          className={`p-1.5 rounded-md border shadow-2xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <span className="text-[6.5px] font-bold opacity-60 block truncate">Ingresos Totales</span>
                          <span className="text-[8.5px] font-black text-blue-600 font-mono block">$12,490</span>
                          <span className="text-[5.5px] font-semibold text-emerald-600">▲ +18.4%</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-md border shadow-2xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <span className="text-[6.5px] font-bold opacity-60 block truncate">Órdenes</span>
                          <span className="text-[8.5px] font-black text-purple-600 font-mono block">148</span>
                          <span className="text-[5.5px] font-semibold text-emerald-600">▲ +9.2%</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-md border shadow-2xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <span className="text-[6.5px] font-bold opacity-60 block truncate">Ticket Promedio</span>
                          <span className="text-[8.5px] font-black text-emerald-600 font-mono block">$84.39</span>
                          <span className="text-[5.5px] font-semibold opacity-60">Estable</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-md border shadow-2xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <span className="text-[6.5px] font-bold opacity-60 block truncate">Caja</span>
                          <span className="text-[8.5px] font-black text-amber-600 font-mono block">$145k</span>
                          <span className="text-[5.5px] font-semibold opacity-60">Disponible</span>
                        </div>
                      </div>

                      {/* Charts & Visuals Preview */}
                      <div
                        className={`grid gap-1.5 flex-1 ${
                          orientation === 'landscape' ? 'grid-cols-3' : 'grid-cols-2'
                        }`}
                      >
                        {/* Simulated Chart 1: Bar */}
                        <div
                          className={`p-1.5 rounded-md border flex flex-col justify-between shadow-2xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <span className="text-[6.5px] font-bold block truncate">Ventas por Categoría</span>
                          <div className="flex items-end gap-1 h-9 px-1 pt-1 justify-around">
                            <div className="w-2.5 bg-blue-500 rounded-t h-[80%]" />
                            <div className="w-2.5 bg-blue-400 rounded-t h-[45%]" />
                            <div className="w-2.5 bg-blue-500 rounded-t h-[65%]" />
                            <div className="w-2.5 bg-blue-400 rounded-t h-[35%]" />
                          </div>
                        </div>

                        {/* Simulated Chart 2: Donut */}
                        <div
                          className={`p-1.5 rounded-md border flex flex-col justify-between shadow-2xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200 shadow-xs'
                          }`}
                        >
                          <span className="text-[6.5px] font-bold block truncate">Distribución Geográfica</span>
                          <div className="flex items-center justify-center h-9">
                            <div className="h-7 w-7 rounded-full border-4 border-sky-400 border-t-emerald-500 border-r-amber-500" />
                          </div>
                        </div>

                        {/* Simulated Chart 3: Table / Summary */}
                        <div
                          className={`p-1.5 rounded-md border flex flex-col justify-between shadow-2xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200 shadow-xs'
                          } ${orientation === 'portrait' ? 'col-span-2' : ''}`}
                        >
                          <span className="text-[6.5px] font-bold block truncate">Plan de Cuentas</span>
                          <div className="space-y-0.5 text-[6px] font-mono pt-1 opacity-80">
                            <div className="flex justify-between border-b border-slate-200/50 pb-0.5">
                              <span>1 Activo Total</span>
                              <span className="font-bold">$625k</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/50 pb-0.5">
                              <span>11 Activo Corriente</span>
                              <span className="font-bold">$205k</span>
                            </div>
                            <div className="flex justify-between">
                              <span>111 Disponible</span>
                              <span className="font-bold">$145k</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* PAGE 2 CONTENT (When sections_two_pages is active and preview page is 2) */}
                  {pageDistribution === 'sections_two_pages' && activePreviewPage === 2 && (
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="p-1 rounded bg-primary/10 border border-primary/20 text-[7px] font-bold text-primary px-2">
                        Sección Detallada: Tablas Contables y Tendencia Mensual
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 flex-1">
                        <div
                          className={`p-2 rounded-md border flex flex-col justify-between shadow-xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="text-[7.5px] font-bold block truncate">Estructura Jerárquica de Cuentas</span>
                          <div className="space-y-1 text-[6.5px] font-mono pt-1 opacity-90">
                            <div className="flex justify-between border-b border-slate-200/50 pb-0.5">
                              <span>1 ACTIVO TOTAL</span>
                              <span className="font-bold text-emerald-600">$625,000.00</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/50 pb-0.5">
                              <span>11 Activo Corriente</span>
                              <span className="font-bold">$205,000.00</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-200/50 pb-0.5">
                              <span>111 Disponible en Bancos</span>
                              <span className="font-bold">$145,000.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span>11101 Caja General</span>
                              <span className="font-bold">$25,000.00</span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`p-2 rounded-md border flex flex-col justify-between shadow-xs ${
                            paperTheme === 'executive_dark'
                              ? 'bg-slate-900 border-slate-800'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="text-[7.5px] font-bold block truncate">Tendencia de Ingresos Semanales</span>
                          <div className="h-16 flex items-end justify-between px-2 pt-2 border-b border-slate-200/50">
                            <div className="w-3 bg-purple-500 rounded-t h-[30%]" />
                            <div className="w-3 bg-purple-500 rounded-t h-[55%]" />
                            <div className="w-3 bg-purple-500 rounded-t h-[75%]" />
                            <div className="w-3 bg-purple-600 rounded-t h-[95%]" />
                          </div>
                          <div className="flex justify-between text-[6px] opacity-60 font-mono mt-1">
                            <span>Sem 1</span>
                            <span>Sem 2</span>
                            <span>Sem 3</span>
                            <span>Sem 4</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulated Executive Footer */}
                {includeFooterConfidential ? (
                  <div
                    className={`p-1.5 border-t text-[6.5px] flex items-center justify-between px-3 shrink-0 transition-all duration-200 ${
                      paperTheme === 'executive_dark'
                        ? 'border-slate-800 bg-slate-900/60 text-slate-400'
                        : 'border-slate-200 bg-slate-50/60 text-slate-500'
                    }`}
                  >
                    <span>Documento confidencial generado por Proyecto BI</span>
                    <span className="font-mono">Página {activePreviewPage} de {totalPages}</span>
                  </div>
                ) : (
                  <div className="h-1 shrink-0" />
                )}
              </div>
            </div>

            {/* Subtle Hint */}
            <p className="text-[10px] text-muted text-center mt-2 flex items-center gap-1">
              <span>💡</span>
              <span>
                {pageDistribution === 'fit_one_page'
                  ? 'El documento se acoplará perfectamente en 1 sola hoja A4 con resolución vectorial y máxima legibilidad.'
                  : 'El documento se dividirá en 2 páginas ordenadas por bloques lógicos sin cortar ninguna tarjeta.'}
              </span>
            </p>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-border bg-surface flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCleanPrint}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border hover:bg-surface-subtle text-muted hover:text-foreground text-xs font-semibold transition-all disabled:opacity-50"
            title="Enviar a impresora física sin barras laterales ni cabeceras del navegador"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Impresión Limpia Directa</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground transition-all disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Descargar {totalPages === 1 ? '1 Hoja PDF' : '2 Hojas PDF'} (.pdf)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
