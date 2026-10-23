'use client';

import {
  Database,
  FileSpreadsheet,
  Sparkles,
  ShieldCheck,
  LayoutGrid,
  FileText,
  Zap,
  ArrowRight,
  Plus,
  BarChart2,
  Table as TableIcon,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import type { DataSource } from '../../lib/data-sources';

interface DashboardOnboardingProps {
  readonly dataSources?: readonly DataSource[];
  readonly onOpenConnectionModal: () => void;
  readonly onLoadDemo: () => void;
  readonly onOpenUploadExcel: () => void;
  readonly onNavigateToBuilder?: (context?: { sourceId?: string; tableId?: string }) => void;
  readonly onNavigateToBrowse?: (context?: { sourceId?: string; tableId?: string }) => void;
}

export function DashboardOnboarding({
  dataSources = [],
  onOpenConnectionModal,
  onLoadDemo,
  onOpenUploadExcel,
  onNavigateToBuilder,
  onNavigateToBrowse,
}: DashboardOnboardingProps) {
  const hasConnectedSources = dataSources.length > 0;

  // If the user already has connected sources, show the intelligent Workspace Hub
  if (hasConnectedSources) {
    return (
      <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:px-8 max-w-5xl mx-auto w-full animate-in fade-in duration-300 space-y-8">
        {/* Workspace Status Hero */}
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>{dataSources.length} {dataSources.length === 1 ? 'Origen Conectado' : 'Orígenes Conectados'}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Lienzo en Blanco Listo para Diseñar
          </h1>

          <p className="text-xs md:text-sm text-muted leading-relaxed">
            Tu espacio ya tiene datos listos. Seleccioná una base para construir tu primera tarjeta o pregunta visual, o vinculá otro origen.
          </p>
        </div>

        {/* Primary CTA Ribbon */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-surface to-primary/5 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm shrink-0">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                ¿Qué métrica o gráfico querés agregar primero?
              </h2>
              <p className="text-[11px] text-muted">
                El Constructor Visual te permite elegir tablas, dimensiones, métricas y estilos en 3 clics.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToBuilder?.()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-sm transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <BarChart2 className="h-4 w-4" />
            <span>+ Añadir Primera Pregunta</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Connected Sources Grid */}
        <div className="w-full space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
              Bases de Datos y Archivos Disponibles
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenUploadExcel}
                className="text-[11px] font-semibold text-muted hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
                <span>+ Subir otro Excel</span>
              </button>
              <span className="text-muted text-xs">&bull;</span>
              <button
                onClick={onOpenConnectionModal}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 transition-colors"
              >
                <Database className="h-3.5 w-3.5" />
                <span>+ Conectar otra Base</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((ds) => {
              const isPostgres = ds.type === 'postgres';
              return (
                <div
                  key={ds.id}
                  className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-xs shrink-0 ${
                            isPostgres ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                          }`}
                        >
                          {isPostgres ? <Database className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{ds.name}</h3>
                          <span className="text-[11px] text-muted">
                            {isPostgres ? 'PostgreSQL &bull; Modo Seguro Solo Lectura' : 'Dataset en Memoria'}
                          </span>
                        </div>
                      </div>

                      <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success border border-success/20 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        Listo
                      </span>
                    </div>

                    {/* Tables snippet */}
                    <div>
                      <span className="text-[11px] font-semibold text-muted block mb-1.5">
                        Tablas disponibles ({ds.tables.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {ds.tables.slice(0, 8).map((tbl) => (
                          <button
                            key={tbl.id}
                            onClick={() => onNavigateToBuilder?.({ sourceId: ds.id, tableId: tbl.id })}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-subtle border border-surface-border hover:border-primary/50 text-[10px] text-foreground font-medium transition-all group"
                            title={`Crear pregunta a partir de ${tbl.name}`}
                          >
                            <TableIcon className="h-2.5 w-2.5 text-muted group-hover:text-primary" />
                            <span>{tbl.name}</span>
                          </button>
                        ))}
                        {ds.tables.length > 8 && (
                          <span className="text-[10px] text-muted self-center">
                            +{ds.tables.length - 8} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this specific source */}
                  <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => onNavigateToBrowse?.({ sourceId: ds.id })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-surface text-[11px] font-semibold text-foreground hover:bg-surface-subtle transition-all"
                    >
                      <TableIcon className="h-3.5 w-3.5 text-muted" />
                      <span>Explorar Tablas</span>
                    </button>

                    <button
                      onClick={() => onNavigateToBuilder?.({ sourceId: ds.id })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Crear Pregunta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Demo Option for Inspiration */}
        <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle/50 border border-surface-border text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="text-muted">
              ¿Querés ver una composición terminada con KPIs y reporte contable de ejemplo?
            </span>
          </div>
          <button
            onClick={onLoadDemo}
            className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold hover:underline shrink-0"
          >
            <span>Cargar Ejemplo Demo</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Architectural Trust Guarantees */}
        <div className="pt-4 border-t border-surface-border w-full grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-surface-border/50">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-foreground">Solo Lectura AST</h3>
              <p className="text-[10px] text-muted">Consultas validadas que nunca alteran datos.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-surface-border/50">
            <LayoutGrid className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-foreground">Grid 12 Columnas</h3>
              <p className="text-[10px] text-muted">Redimensioná y reordená con fluidez.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-surface-border/50">
            <FileText className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-foreground">Exportación PDF A4</h3>
              <p className="text-[10px] text-muted">Reportes ejecutivos de alta resolución.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface/50 border border-surface-border/50">
            <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-foreground">Tiempo Real (SSE)</h3>
              <p className="text-[10px] text-muted">Refresco automático con control por tarjeta.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial Onboarding when NO sources exist
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-xs">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Espacio de Trabajo Listo</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Tu Lienzo de Negocio en Blanco
        </h1>

        <p className="text-sm md:text-base text-muted leading-relaxed">
          Inicializa tu espacio conectando tu base de datos PostgreSQL, explorando el tablero de demostración interactivo, o cargando un archivo en memoria.
        </p>
      </div>

      {/* Main 3 Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10">
        {/* Card 1: Connect PostgreSQL (Recommended) */}
        <div className="group relative rounded-2xl border-2 border-primary/30 hover:border-primary bg-surface p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <Database className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary text-primary-foreground shadow-xs">
                Recomendado
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Conectar PostgreSQL
              </h2>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Conéctate a tu base de datos local o remota en modo seguro (solo lectura) con diagnóstico guiado de red, Docker y puertos.
              </p>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button
              onClick={onOpenConnectionModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
            >
              <span>Conectar Base de Datos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Card 2: Load Demo Dashboard */}
        <div className="group relative rounded-2xl border border-surface-border hover:border-purple-500/40 bg-surface p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                Ejemplo en Vivo
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Ver Tablero de Demostración
              </h2>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Explora cómo funciona el tablero: KPIs ejecutivos, gráficos de ECharts con relieve, y el reporte contable jerárquico.
              </p>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button
              onClick={onLoadDemo}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 text-xs font-bold hover:bg-purple-500/20 shadow-xs transition-all"
            >
              <span>Cargar Ejemplo Demo</span>
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Card 3: Upload Excel or CSV */}
        <div className="group relative rounded-2xl border border-surface-border hover:border-emerald-500/40 bg-surface p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                En Memoria
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Subir Archivo Excel / CSV
              </h2>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Analiza conjuntos de datos y tablas inmediatamente sin necesidad de bases de datos ni configuración de red.
              </p>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button
              onClick={onOpenUploadExcel}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 shadow-xs transition-all"
            >
              <span>Subir Archivo Local</span>
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Trust & Architectural Highlights */}
      <div className="mt-12 pt-8 border-t border-surface-border w-full grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-surface-border/50">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-foreground">Solo Lectura (AST)</h3>
            <p className="text-[11px] text-muted mt-0.5">El sistema nunca muta ni ejecuta escrituras en tu base.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-surface-border/50">
          <LayoutGrid className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-foreground">Lienzo Adaptativo</h3>
            <p className="text-[11px] text-muted mt-0.5">Grid de 12 columnas con reordenamiento y redimensionamiento.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-surface-border/50">
          <FileText className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-foreground">Reportes PDF A4</h3>
            <p className="text-[11px] text-muted mt-0.5">Exportación ejecutiva en alta resolución con previa en vivo.</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-surface-border/50">
          <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-foreground">Tiempo Real</h3>
            <p className="text-[11px] text-muted mt-0.5">Refresco automático con control de caché por tarjeta.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
