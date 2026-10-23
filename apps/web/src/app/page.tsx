'use client';

import { useEffect, useState } from 'react';
import type { ConnectionConfig, DashboardDocument } from '@bi/contracts';
import { Sidebar, type AppView } from '../components/layout/sidebar';
import { DashboardCanvas, type DynamicCard } from '../components/dashboard/dashboard-canvas';
import { DataBrowserView } from '../components/views/data-browser-view';
import { VisualBuilderView } from '../components/views/visual-builder-view';
import { ConnectionsView } from '../components/views/connections-view';
import { DiagnosticModal } from '../components/connections/diagnostic-modal';
import { ExcelUploadModal } from '../components/connections/excel-upload-modal';
import {
  demoPostgresSource,
  introspectPostgresDataSource,
  type DataSource,
} from '../lib/data-sources';

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

const SAVED_CONNECTIONS_KEY = 'proyecto_bi_saved_connections_v1';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<AppView>('dashboards');
  const [dataSources, setDataSources] = useState<readonly DataSource[]>([
    demoPostgresSource,
  ]);
  const [dynamicCards, setDynamicCards] = useState<readonly DynamicCard[]>([]);
  const [builderContext, setBuilderContext] = useState<{
    sourceId?: string;
    tableId?: string;
  }>({});

  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load saved PostgreSQL connections on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SAVED_CONNECTIONS_KEY);
      if (raw) {
        const configs: ConnectionConfig[] = JSON.parse(raw);
        if (Array.isArray(configs) && configs.length > 0) {
          configs.forEach(async (cfg) => {
            const { source } = await introspectPostgresDataSource(cfg);
            setDataSources((prev) => {
              if (prev.some((ds) => ds.id === source.id)) return prev;
              return [source, ...prev];
            });
          });
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Synchronize documentElement class whenever isDarkMode state changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSourceAdded = (newSource: DataSource) => {
    setDataSources((prev) => [newSource, ...prev]);
  };

  const handleEnsureDemoSource = () => {
    setDataSources((prev) => {
      if (prev.some((ds) => ds.id === demoPostgresSource.id)) return prev;
      return [...prev, demoPostgresSource];
    });
  };

  const handleConnectionSaved = async (config: ConnectionConfig) => {
    // 1. Introspect live PostgreSQL tables and schema from backend
    const { source } = await introspectPostgresDataSource(config);

    // 2. Add or replace in state
    setDataSources((prev) => {
      const existing = prev.filter((ds) => ds.id !== source.id);
      return [source, ...existing];
    });

    // 3. Persist connection configuration in localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(SAVED_CONNECTIONS_KEY);
        const list: ConnectionConfig[] = raw ? JSON.parse(raw) : [];
        const nextList = [config, ...list.filter((c) => c.id !== config.id)];
        localStorage.setItem(SAVED_CONNECTIONS_KEY, JSON.stringify(nextList));
      } catch {
        // Ignore
      }
    }
  };

  const handleOpenBuilderWithTable = (sourceId: string, tableId: string) => {
    setBuilderContext({ sourceId, tableId });
    setCurrentView('builder');
  };

  const handleSelectTableFromConnections = (sourceId: string, tableId: string) => {
    setBuilderContext({ sourceId, tableId });
    setCurrentView('browse');
  };

  const handleSaveCardToDashboard = (card: DynamicCard) => {
    setDynamicCards((prev) => [card, ...prev]);
    setCurrentView('dashboards');
  };

  const handleDeleteCard = (index: number) => {
    setDynamicCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      {/* Persistent Metabase-grade Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onOpenUploadExcel={() => setIsExcelModalOpen(true)}
        activeSourcesCount={dataSources.length}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {currentView === 'dashboards' && (
          <DashboardCanvas
            initialDocument={initialDashboardDoc}
            dynamicCards={dynamicCards}
            onDeleteCard={handleDeleteCard}
            onNavigateToBuilder={() => setCurrentView('builder')}
            isDarkMode={isDarkMode}
            onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
            onOpenUploadExcel={() => setIsExcelModalOpen(true)}
            onEnsureDemoSource={handleEnsureDemoSource}
          />
        )}

        {currentView === 'browse' && (
          <DataBrowserView
            dataSources={dataSources}
            onOpenBuilderWithTable={handleOpenBuilderWithTable}
            onOpenUploadExcel={() => setIsExcelModalOpen(true)}
          />
        )}

        {currentView === 'builder' && (
          <VisualBuilderView
            dataSources={dataSources}
            preselectedSourceId={builderContext.sourceId}
            preselectedTableId={builderContext.tableId}
            onSaveToDashboard={handleSaveCardToDashboard}
            onOpenUploadExcel={() => setIsExcelModalOpen(true)}
            isDarkMode={isDarkMode}
          />
        )}

        {currentView === 'connections' && (
          <ConnectionsView
            dataSources={dataSources}
            onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
            onOpenUploadExcel={() => setIsExcelModalOpen(true)}
            onSelectTable={handleSelectTableFromConnections}
          />
        )}
      </div>

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
