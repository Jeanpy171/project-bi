'use client';

import { useEffect, useState } from 'react';
import type { GridCardItem } from './dashboard-canvas';
import {
  Check,
  Code,
  Copy,
  Download,
  Globe,
  Link2,
  Printer,
  Shield,
  X,
} from 'lucide-react';

interface ShareDashboardModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly dashboardTitle: string;
  readonly cards: readonly GridCardItem[];
}

export function ShareDashboardModal({
  isOpen,
  onClose,
  dashboardTitle,
  cards,
}: ShareDashboardModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const embedCode = `<iframe src="${shareUrl}" width="100%" height="800" frameborder="0" allowfullscreen style="border-radius: 16px; border: 1px solid #e2e8f0;"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleDownloadJson = () => {
    const exportData = {
      title: dashboardTitle,
      exportedAt: new Date().toISOString(),
      cardsCount: cards.length,
      cards: cards.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        chartKind: c.chartKind,
        width: c.width,
        height: c.height,
        customColor: c.customColor,
        badge: c.badge,
        summaryValue: c.summaryValue,
        trendText: c.trendText,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${dashboardTitle.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-surface border border-surface-border rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Compartir Tablero</h2>
              <p className="text-xs text-muted">Generar enlace público, código embed o exportar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface-subtle transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Direct Link Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                Enlace Directo del Tablero
              </span>
              <span className="text-[11px] text-muted flex items-center gap-1">
                <Shield className="h-3 w-3 text-success" />
                Solo lectura segura
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-xs text-foreground font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-all shadow-sm shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Embed iFrame Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-primary" />
              Incrustar en sitio web o portal corporativo (iFrame)
            </label>
            <div className="flex items-center gap-2">
              <textarea
                readOnly
                rows={2}
                value={embedCode}
                className="flex-1 px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle text-xs text-foreground font-mono focus:outline-none resize-none"
              />
              <button
                onClick={handleCopyEmbed}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-border bg-surface text-foreground hover:bg-surface-subtle text-xs font-bold transition-all shadow-sm shrink-0"
              >
                {copiedEmbed ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span className="text-success">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted" />
                    <span>Copiar Embed</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="pt-2 border-t border-surface-border">
            <span className="text-xs font-bold text-foreground block mb-3">
              Opciones de Exportación
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-surface-border bg-surface hover:bg-surface-subtle text-foreground text-xs font-bold transition-all shadow-sm"
              >
                <Printer className="h-4 w-4 text-primary" />
                <span>Imprimir / Guardar PDF</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-surface-border bg-surface hover:bg-surface-subtle text-foreground text-xs font-bold transition-all shadow-sm"
              >
                <Download className="h-4 w-4 text-primary" />
                <span>Exportar Esquema JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-surface-subtle/50 border-t border-surface-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-surface-border bg-surface text-foreground text-xs font-bold hover:bg-surface-subtle transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
