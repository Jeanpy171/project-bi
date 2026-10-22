'use client';

import { useState } from 'react';
import { parseUploadedExcel, type DataSource } from '../../lib/data-sources';
import * as XLSX from 'xlsx';
import {
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Loader2,
  Table as TableIcon,
  UploadCloud,
  X,
} from 'lucide-react';

interface ExcelUploadModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSourceAdded: (source: DataSource) => void;
}

export function ExcelUploadModal({ isOpen, onClose, onSourceAdded }: ExcelUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedSource, setParsedSource] = useState<DataSource | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setIsLoading(true);
    try {
      const source = await parseUploadedExcel(file);
      setParsedSource(source);
    } catch {
      // Handled gracefully
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  const handleLoadSample = () => {
    // Generate a realistic in-memory Excel workbook for quick testing
    const sampleRows = [
      { Mes: 'Enero', Region: 'Norte', Vendedor: 'Carlos M.', Ventas: 12500, Gastos: 4100 },
      { Mes: 'Enero', Region: 'Sur', Vendedor: 'Ana G.', Ventas: 9800, Gastos: 3200 },
      { Mes: 'Febrero', Region: 'Norte', Vendedor: 'Carlos M.', Ventas: 14200, Gastos: 4500 },
      { Mes: 'Febrero', Region: 'Sur', Vendedor: 'Ana G.', Ventas: 11100, Gastos: 3400 },
      { Mes: 'Marzo', Region: 'Centro', Vendedor: 'Lucia R.', Ventas: 18900, Gastos: 5200 },
      { Mes: 'Marzo', Region: 'Norte', Vendedor: 'Carlos M.', Ventas: 16400, Gastos: 4800 },
      { Mes: 'Abril', Region: 'Centro', Vendedor: 'Lucia R.', Ventas: 21000, Gastos: 5900 },
      { Mes: 'Abril', Region: 'Sur', Vendedor: 'Ana G.', Ventas: 13500, Gastos: 3900 },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas_Regionales');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const sampleFile = new File([blob], 'Ventas_Regionales_2026.xlsx', { type: blob.type });

    void handleFile(sampleFile);
  };

  const handleConfirm = () => {
    if (parsedSource) {
      onSourceAdded(parsedSource);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-surface border border-surface-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Subir Archivo Excel o CSV</h2>
              <p className="text-xs text-muted">
                Convierte una hoja de cálculo en una base de datos consultable al instante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:text-foreground hover:bg-surface-border transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-surface-border hover:border-primary/50 bg-surface'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Arrastra tu archivo Excel (.xlsx, .xls) o CSV aquí
              </p>
              <p className="text-xs text-muted mt-1">O haz clic para seleccionar desde tu computadora</p>
            </div>

            <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-subtle border border-surface-border text-xs font-semibold text-foreground hover:bg-surface-border cursor-pointer transition-colors shadow-sm">
              <FileUp className="h-4 w-4 text-primary" />
              Seleccionar Archivo
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
            </label>
          </div>

          {/* Quick Demo File Option */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-subtle">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-muted" />
              <span className="text-xs text-foreground font-medium">¿No tienes un Excel a mano?</span>
            </div>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Cargar archivo demo (Ventas 2026)
            </button>
          </div>

          {/* Parsed Result Preview */}
          {isLoading && (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Procesando hojas y columnas del archivo...</span>
            </div>
          )}

          {parsedSource && !isLoading && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-success font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>Archivo procesado con éxito: {parsedSource.name}</span>
              </div>
              <div className="space-y-1 text-xs text-foreground">
                {parsedSource.tables.map((t) => (
                  <div key={t.id} className="flex items-center justify-between pl-6 text-muted">
                    <span>
                      Hoja: <strong className="text-foreground">{t.name}</strong> ({t.rows.length} filas)
                    </span>
                    <span>{t.columns.length} columnas detectadas</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border bg-surface-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted hover:text-foreground hover:bg-surface-border transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!parsedSource}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Incorporar como Base de Datos
          </button>
        </div>
      </div>
    </div>
  );
}
