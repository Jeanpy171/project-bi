'use client';

import { useState } from 'react';
import type { DashboardDocument } from '@bi/contracts';
import { DashboardCanvas } from '../components/dashboard/dashboard-canvas';
import { DiagnosticModal } from '../components/connections/diagnostic-modal';
import { Activity, BarChart2, Database, Layers, Moon, Sun } from 'lucide-react';

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
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-accent text-white shadow-md">
                <BarChart2 className="h-5 w-5" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">
                Proyecto <span className="text-primary">BI</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-muted">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle text-foreground shadow-sm">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Dashboards
              </button>
              <button
                onClick={() => setIsConnectionModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-surface-subtle transition-colors"
              >
                <Database className="h-3.5 w-3.5" />
                Conexiones
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-foreground hover:bg-surface-subtle transition-colors">
                <Activity className="h-3.5 w-3.5" />
                Consultas SQL
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-surface-border bg-surface-subtle px-3 py-1 text-xs text-muted">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>PostgreSQL Demo: Conectado</span>
            </div>

            <button
              onClick={toggleDarkMode}
              className="rounded-xl border border-surface-border bg-surface p-2 text-muted hover:text-foreground hover:bg-surface-subtle transition-colors shadow-sm"
              title="Cambiar tema"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <DashboardCanvas
          initialDocument={initialDashboardDoc}
          onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        />
      </main>

      {/* Connection & Diagnostic Modal */}
      <DiagnosticModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
      />
    </div>
  );
}
