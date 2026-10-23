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
import { AICopilotModal } from '../components/ai/ai-copilot-modal';
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
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Synchronize view and context from URL on initial load and handle browser back/forward
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readStateFromUrl = () => {
      const path = window.location.pathname.replace(/^\//, '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const sourceParam = params.get('source');
      const tableParam = params.get('table');

      let initialView: AppView = 'dashboards';
      const validViews: AppView[] = ['dashboards', 'browse', 'builder', 'connections'];

      if (viewParam && validViews.includes(viewParam as AppView)) {
        initialView = viewParam as AppView;
      } else if (path && validViews.includes(path as AppView)) {
        initialView = path as AppView;
      }

      setCurrentView(initialView);
      if (sourceParam || tableParam) {
        setBuilderContext({
          sourceId: sourceParam || undefined,
          tableId: tableParam || undefined,
        });
      }
    };

    readStateFromUrl();

    const handlePopState = () => {
      readStateFromUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Coordinated URL navigation helper
  const navigateToView = (
    view: AppView,
    context?: { sourceId?: string; tableId?: string },
  ) => {
    setCurrentView(view);
    const nextContext = context
      ? { ...builderContext, ...context }
      : view === 'dashboards' || view === 'connections'
      ? {}
      : builderContext;
    setBuilderContext(nextContext);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (view !== 'dashboards') {
        params.set('view', view);
      }
      if (nextContext.sourceId) params.set('source', nextContext.sourceId);
      if (nextContext.tableId) params.set('table', nextContext.tableId);

      const qs = params.toString();
      const nextUrl = qs ? `/?${qs}` : '/';
      window.history.pushState({ view, context: nextContext }, '', nextUrl);
    }
  };

  const handleTableSelectedInBrowser = (sourceId: string, tableId: string) => {
    setBuilderContext({ sourceId, tableId });
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('view', 'browse');
      if (sourceId) params.set('source', sourceId);
      else params.delete('source');
      if (tableId) params.set('table', tableId);
      else params.delete('table');
      window.history.replaceState({ view: 'browse', sourceId, tableId }, '', `/?${params.toString()}`);
    }
  };

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

  const handleSaveCardToDashboard = (card: DynamicCard) => {
    setDynamicCards((prev) => [card, ...prev]);
    navigateToView('dashboards');
  };

  const handleDeleteCard = (index: number) => {
    setDynamicCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased">
      {/* Persistent Metabase-grade Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => navigateToView(v)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onOpenUploadExcel={() => setIsExcelModalOpen(true)}
        onOpenAICopilot={() => setIsAICopilotOpen(true)}
        activeSourcesCount={dataSources.length}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {currentView === 'dashboards' && (
          <DashboardCanvas
            initialDocument={initialDashboardDoc}
            dynamicCards={dynamicCards}
            onDeleteCard={handleDeleteCard}
            onNavigateToBuilder={(ctx) => navigateToView('builder', ctx)}
            onNavigateToBrowse={(ctx) => navigateToView('browse', ctx)}
            isDarkMode={isDarkMode}
            onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
            onOpenUploadExcel={() => setIsExcelModalOpen(true)}
            onOpenAICopilot={() => setIsAICopilotOpen(true)}
            onEnsureDemoSource={handleEnsureDemoSource}
            dataSources={dataSources}
          />
        )}

        {currentView === 'browse' && (
          <DataBrowserView
            dataSources={dataSources}
            initialSourceId={builderContext.sourceId}
            initialTableId={builderContext.tableId}
            onOpenBuilderWithTable={(s, t) => navigateToView('builder', { sourceId: s, tableId: t })}
            onOpenUploadExcel={() => setIsExcelModalOpen(true)}
            onTableSelected={handleTableSelectedInBrowser}
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
            onSelectTable={(s, t) => navigateToView('browse', { sourceId: s, tableId: t })}
            onOpenBuilderWithTable={(s, t) => navigateToView('builder', { sourceId: s, tableId: t })}
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

      {/* AI Copilot Modal (Ollama local & Google Gemini) */}
      <AICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        dataSources={dataSources}
        activeSourceId={builderContext.sourceId}
        onInsertCardToDashboard={handleSaveCardToDashboard}
      />
    </div>
  );
}
