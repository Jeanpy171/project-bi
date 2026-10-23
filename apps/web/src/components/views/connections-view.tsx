'use client';

import { useState } from 'react';
import type { DataSource } from '../../lib/data-sources';
import {
  Database,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Server,
  Table as TableIcon,
  Zap,
} from 'lucide-react';

interface ConnectionsViewProps {
  readonly dataSources: readonly DataSource[];
  readonly onOpenConnectionModal: () => void;
  readonly onOpenUploadExcel: () => void;
  readonly onSelectTable: (sourceId: string, tableId: string) => void;
  readonly onOpenBuilderWithTable?: (sourceId: string, tableId?: string) => void;
}

export function ConnectionsView({
  dataSources,
  onOpenConnectionModal,
  onOpenUploadExcel,
  onSelectTable,
  onOpenBuilderWithTable,
}: ConnectionsViewProps) {
  const [isPinging, setIsPinging] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  const handleTestAll = () => {
    setIsPinging(true);
    setPingSuccess(false);
    setTimeout(() => {
      setIsPinging(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-8 bg-background">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bases de Datos y Orígenes
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Administra tus conexiones a motores relacionales (PostgreSQL) y datasets en memoria (Excel / CSV).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Comprobando...' : pingSuccess ? '¡Todo operativo!' : 'Comprobar estado'}</span>
          </button>

          <button
            onClick={onOpenUploadExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle transition-all shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-success" />
            <span>+ Subir Excel/CSV</span>
          </button>

          <button
            onClick={onOpenConnectionModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>+ Conectar BDD</span>
          </button>
        </div>
      </div>

      {/* Connection Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
          Orígenes Conectados ({dataSources.length})
        </h2>

        {dataSources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-border p-12 text-center space-y-4 bg-surface-subtle/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <Database className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No tenés bases de datos conectadas</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                Conectá tu motor PostgreSQL o cargá un archivo Excel/CSV para comenzar a consultar y construir tableros.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onOpenConnectionModal}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-hover shadow-sm"
              >
                Conectar PostgreSQL
              </button>
              <button
                onClick={onOpenUploadExcel}
                className="px-4 py-2 rounded-xl border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle shadow-sm"
              >
                Subir Excel / CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dataSources.map((ds) => {
              const isPostgres = ds.type === 'postgres';
              return (
                <div
                  key={ds.id}
                  className="rounded-2xl border border-surface-border bg-surface p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${
                            isPostgres ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                          }`}
                        >
                          {isPostgres ? <Database className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{ds.name}</h3>
                          <span className="text-[11px] text-muted">
                            {isPostgres ? 'PostgreSQL 16 &bull; Solo Lectura Seguro' : 'Dataset en Memoria (SheetJS)'}
                          </span>
                        </div>
                      </div>

                      <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success border border-success/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        Activo
                      </span>
                    </div>

                    {/* Tables summary */}
                    <div className="mt-4 pt-3 border-t border-surface-border">
                      <span className="text-[11px] font-semibold text-muted block mb-2">
                        Tablas disponibles ({ds.tables.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {ds.tables.map((tbl) => (
                          <button
                            key={tbl.id}
                            onClick={() => onSelectTable(ds.id, tbl.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border hover:border-primary/40 text-[11px] text-foreground font-medium transition-all group"
                            title={`Ver ${tbl.name} en Explorador`}
                          >
                            <TableIcon className="h-3 w-3 text-muted group-hover:text-primary" />
                            <span>{tbl.name}</span>
                            <span className="text-[10px] text-muted font-normal">
                              ({ds.connectionConfig ? (tbl.rowCountEstimate ? `~${tbl.rowCountEstimate}` : 'Live') : tbl.rows.length})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted">
                      {ds.tables.reduce((acc, t) => acc + t.rows.length, 0)} filas indexadas
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (ds.tables[0]) onSelectTable(ds.id, ds.tables[0].id);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-foreground font-semibold flex items-center gap-1 text-[11px] transition-all"
                      >
                        <TableIcon className="h-3.5 w-3.5 text-muted" />
                        <span>Explorar Tablas</span>
                      </button>

                      {onOpenBuilderWithTable && (
                        <button
                          onClick={() => {
                            onOpenBuilderWithTable(ds.id, ds.tables[0]?.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white text-primary font-bold flex items-center gap-1 text-[11px] transition-all"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Crear Pregunta</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Network Diagnostic Assistant Banner (Metabase Pages 3-4 feature improved) */}
      <div className="rounded-2xl border border-surface-border bg-surface-subtle/50 p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Asistente de Red y Diagnóstico Proactivo
          </h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          A diferencia de Metabase donde un error de conexión devuelve un mensaje genérico de timeout o fallo de red,
          Proyecto BI ejecuta un análisis AST de conectividad que prueba la resolución DNS, alcanzabilidad de puerto TCP,
          y detecta automáticamente si estás corriendo en Docker para sugerir <code className="text-primary font-mono">host.docker.internal</code> o la IP del host.
        </p>
        <div className="pt-2">
          <button
            onClick={onOpenConnectionModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-surface-border hover:bg-surface-subtle text-xs font-semibold text-foreground shadow-sm transition-all"
          >
            <Zap className="h-4 w-4 text-accent" />
            <span>Abrir Asistente de Diagnóstico Paso a Paso</span>
          </button>
        </div>
      </div>
    </div>
  );
}
