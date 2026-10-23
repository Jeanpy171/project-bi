'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchPostgresTableRows,
  type DataSource,
  type DataTable,
} from '../../lib/data-sources';
import {
  BarChart2,
  Loader2,
  RefreshCw,
  Search,
  Table as TableIcon,
} from 'lucide-react';

interface DataBrowserViewProps {
  readonly dataSources: readonly DataSource[];
  readonly onOpenBuilderWithTable: (sourceId: string, tableId: string) => void;
  readonly onOpenUploadExcel: () => void;
}

export function DataBrowserView({
  dataSources,
  onOpenBuilderWithTable,
  onOpenUploadExcel,
}: DataBrowserViewProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    dataSources[0]?.id || '',
  );
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [filterText, setFilterText] = useState('');

  // Live PostgreSQL query state
  const [liveRows, setLiveRows] = useState<Record<string, unknown>[]>([]);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveExecutionMs, setLiveExecutionMs] = useState<number | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  const currentSource = useMemo(() => {
    return dataSources.find((ds) => ds.id === selectedSourceId) || dataSources[0];
  }, [dataSources, selectedSourceId]);

  const currentTable: DataTable | undefined = useMemo(() => {
    if (!currentSource || currentSource.tables.length === 0) return undefined;
    return (
      currentSource.tables.find((t) => t.id === selectedTableId) ||
      currentSource.tables[0]
    );
  }, [currentSource, selectedTableId]);

  const loadLiveTableData = async () => {
    if (currentSource?.connectionConfig && currentTable?.schema && currentTable?.tableName) {
      setIsFetchingLive(true);
      setLiveError(null);
      const res = await fetchPostgresTableRows(
        currentSource.connectionConfig,
        currentTable.schema,
        currentTable.tableName,
        100,
      );
      setIsFetchingLive(false);
      if (res.error) {
        setLiveError(res.error);
      } else {
        setLiveRows(res.rows);
        setLiveExecutionMs(res.executionMs);
      }
    } else {
      setLiveRows([]);
      setLiveExecutionMs(null);
      setLiveError(null);
    }
  };

  useEffect(() => {
    loadLiveTableData();
  }, [currentSource?.id, currentTable?.id]);

  const activeRows = useMemo(() => {
    if (currentSource?.connectionConfig) {
      return liveRows;
    }
    return currentTable?.rows || [];
  }, [currentSource, currentTable, liveRows]);

  const filteredRows = useMemo(() => {
    if (activeRows.length === 0) return [];
    if (!filterText.trim()) return activeRows;

    const lower = filterText.toLowerCase();
    return activeRows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(lower)),
    );
  }, [activeRows, filterText]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Tables Sidebar (Inspired by Metabase Page 15 & 16) */}
      <div className="w-64 border-r border-surface-border bg-surface p-4 flex flex-col gap-4 shrink-0">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
            Origen de Datos
          </label>
          <select
            value={currentSource?.id || ''}
            onChange={(e) => {
              setSelectedSourceId(e.target.value);
              setSelectedTableId('');
            }}
            className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            {dataSources.map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Tablas / Hojas ({currentSource?.tables.length || 0})
            </span>
            {currentSource?.type === 'excel' && (
              <button
                type="button"
                onClick={onOpenUploadExcel}
                className="text-[10px] text-primary font-semibold hover:underline"
              >
                + Subir otro
              </button>
            )}
          </div>

          {currentSource?.tables.map((table) => {
            const isActive = currentTable?.id === table.id;
            return (
              <button
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold shadow-sm'
                    : 'text-foreground/80 hover:bg-surface-subtle hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <TableIcon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted'}`} />
                  <span className="truncate">{table.name}</span>
                </div>
                <span className="text-[10px] text-muted shrink-0 font-normal">
                  {table.rows.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Data Grid Area (Inspired by Metabase Page 12 & 15-16) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Header of Table Explorer */}
        <div className="p-4 border-b border-surface-border bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">{currentSource?.name} &gt;</span>
              <h2 className="text-base font-bold text-foreground">{currentTable?.name}</h2>
              {currentSource?.connectionConfig && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-success/10 text-success border border-success/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span>En Vivo {liveExecutionMs !== null ? `(${liveExecutionMs}ms)` : ''}</span>
                </span>
              )}
              <span className="text-xs text-muted font-normal">
                ({filteredRows.length} {currentSource?.connectionConfig ? 'filas cargadas' : `de ${currentTable?.rows.length || 0} filas`})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {currentSource?.connectionConfig && (
              <button
                onClick={loadLiveTableData}
                disabled={isFetchingLive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle shadow-sm transition-all disabled:opacity-50"
                title="Volver a consultar la base de datos PostgreSQL"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetchingLive ? 'animate-spin text-primary' : ''}`} />
                <span>Refrescar</span>
              </button>
            )}

            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filtrar datos..."
                className="w-48 pl-8 pr-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>

            <button
              onClick={() => {
                if (currentSource && currentTable) {
                  onOpenBuilderWithTable(currentSource.id, currentTable.id);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all"
            >
              <BarChart2 className="h-4 w-4" />
              Crear Gráfico con esta Tabla
            </button>
          </div>
        </div>

        {/* Data Grid Table View */}
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-xl border border-surface-border bg-surface shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-subtle border-b border-surface-border text-foreground font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-2.5 px-3 text-muted w-10 text-center font-normal">#</th>
                  {currentTable?.columns.map((col) => (
                    <th key={col.name} className="py-2.5 px-3 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{col.name}</span>
                        <span className="text-[10px] font-normal text-muted uppercase">
                          ({col.type})
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {isFetchingLive ? (
                  <tr>
                    <td colSpan={(currentTable?.columns.length || 0) + 1} className="py-12 text-center text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs font-semibold">Consultando base de datos PostgreSQL en vivo...</span>
                      </div>
                    </td>
                  </tr>
                ) : liveError ? (
                  <tr>
                    <td colSpan={(currentTable?.columns.length || 0) + 1} className="py-8 text-center text-danger">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-xs font-semibold">{liveError}</span>
                        <button
                          onClick={loadLiveTableData}
                          className="px-3 py-1 text-xs font-bold rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 transition-all"
                        >
                          Reintentar Consulta
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={(currentTable?.columns.length || 0) + 1} className="py-8 text-center text-muted text-xs">
                      No se encontraron registros en esta tabla.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-primary/[0.02] transition-colors text-foreground font-normal"
                  >
                    <td className="py-2 px-3 text-muted text-center text-[10px] font-mono select-none">
                      {idx + 1}
                    </td>
                    {currentTable?.columns.map((col) => {
                      const val = row[col.name];
                      const isNumber = col.type === 'number';
                      return (
                        <td
                          key={col.name}
                          className={`py-2 px-3 ${isNumber ? 'font-mono text-foreground' : 'text-foreground'}`}
                        >
                          {typeof val === 'number'
                            ? val.toLocaleString()
                            : String(val !== undefined && val !== null ? val : '')}
                        </td>
                      );
                    })}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
