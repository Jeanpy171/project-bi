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
} from 'lucide-react';

interface DashboardOnboardingProps {
  readonly onOpenConnectionModal: () => void;
  readonly onLoadDemo: () => void;
  readonly onOpenUploadExcel: () => void;
}

export function DashboardOnboarding({
  onOpenConnectionModal,
  onLoadDemo,
  onOpenUploadExcel,
}: DashboardOnboardingProps) {
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
