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
