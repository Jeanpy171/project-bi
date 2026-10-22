'use client';

import { useState } from 'react';
import type { ConnectionConfig, DashboardDocument } from '@bi/contracts';
import { DashboardCanvas } from '../components/dashboard/dashboard-canvas';
import { DiagnosticModal } from '../components/connections/diagnostic-modal';
import { ExcelUploadModal } from '../components/connections/excel-upload-modal';
import {
  demoPostgresSource,
  type DataSource,
} from '../lib/data-sources';
import {
  BarChart2,
  Database,
  FileSpreadsheet,
  Layers,
  Moon,
  Sun,
} from 'lucide-react';

const initialDashboardDoc: DashboardDocument = {
  version: 1,
  id: 'd123e456-e89b-12d3-a456-426614174000',
  title: 'Tablero General de Negocio (Retail & Finanzas)',
  description: 'Métricas clave en vivo, análisis de ventas e informe contable jerárquico.',
  cards: [],
  refreshIntervalSeconds: 10,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function HomePage() {
  const [dataSources, setDataSources] = useState<readonly DataSource[]>([
    demoPostgresSource,
  ]);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode as requested by user

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const handleSourceAdded = (newSource: DataSource) => {
    setDataSources((prev) => [newSource, ...prev]);
  };

  const handleConnectionSaved = (config: ConnectionConfig) => {
    const customSource: DataSource = {
      id: config.id,
      name: `${config.name} (${config.database})`,
      type: 'postgres',
      tables: demoPostgresSource.tables.map((t) => ({
        ...t,
        id: `tbl-${config.id}-${t.name}`,
      })),
    };

    setDataSources((prev) => [customSource, ...prev]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur-md shadow-sm">
        <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent text-white shadow-md">
                <BarChart2 className="h-5 w-5" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Proyecto <span className="text-primary">BI</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-muted">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle text-foreground shadow-sm">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Dashboards
              </button>
              <button
                onClick={() => setIsConnectionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-surface-subtle transition-colors"
              >
                <Database className="h-3.5 w-3.5 text-primary" />
                Conectar BDD
              </button>
              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-surface-subtle transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
                Subir Excel/CSV
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Sources Badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-surface-border bg-surface-subtle px-3 py-1 text-xs text-foreground font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>{dataSources.length} Fuentes activas ({dataSources[0]?.name})</span>
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="rounded-xl border border-surface-border bg-surface p-2 text-muted hover:text-foreground hover:bg-surface-subtle transition-colors shadow-sm"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <DashboardCanvas
          initialDocument={initialDashboardDoc}
          dataSources={dataSources}
          onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
          onOpenUploadExcel={() => setIsExcelModalOpen(true)}
        />
      </main>

      {/* Diagnostic Connection Modal */}
      <DiagnosticModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onConnectionSaved={handleConnectionSaved}
      />

      {/* Excel & CSV Upload Modal */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onSourceAdded={handleSourceAdded}
      />
    </div>
  );
}
