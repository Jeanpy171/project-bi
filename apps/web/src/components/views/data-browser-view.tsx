'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchPostgresTableRows,
  type DataSource,
  type DataTable,
} from '../../lib/data-sources';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Table as TableIcon,
} from 'lucide-react';

interface DataBrowserViewProps {
  readonly dataSources: readonly DataSource[];
  readonly initialSourceId?: string;
  readonly initialTableId?: string;
  readonly onOpenBuilderWithTable: (sourceId: string, tableId: string) => void;
  readonly onOpenUploadExcel: () => void;
  readonly onTableSelected?: (sourceId: string, tableId: string) => void;
}

export function DataBrowserView({
  dataSources,
  initialSourceId,
  initialTableId,
  onOpenBuilderWithTable,
  onOpenUploadExcel,
  onTableSelected,
}: DataBrowserViewProps) {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    initialSourceId || dataSources[0]?.id || '',
  );
  const [selectedTableId, setSelectedTableId] = useState<string>(
    initialTableId || '',
  );
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    if (initialSourceId && initialSourceId !== selectedSourceId) {
      setSelectedSourceId(initialSourceId);
    }
  }, [initialSourceId, selectedSourceId]);

  useEffect(() => {
    if (initialTableId && initialTableId !== selectedTableId) {
      setSelectedTableId(initialTableId);
    }
  }, [initialTableId, selectedTableId]);

  // Live PostgreSQL query state
  const [liveRows, setLiveRows] = useState<Record<string, unknown>[]>([]);
  const [liveTotalRows, setLiveTotalRows] = useState<number | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveExecutionMs, setLiveExecutionMs] = useState<number | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Sorting & Pagination state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const isLive = Boolean(currentSource?.connectionConfig);

  // Fetch live table data from PostgreSQL with server-side pagination, sorting, and filtering
  const loadLiveTableData = useCallback(async () => {
    if (currentSource?.connectionConfig && currentTable?.schema && currentTable?.tableName) {
      setIsFetchingLive(true);
      setLiveError(null);
      const res = await fetchPostgresTableRows(
        currentSource.connectionConfig,
        currentTable.schema,
        currentTable.tableName,
        {
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          sortColumn,
          sortDirection,
          filterText,
        },
      );
      setIsFetchingLive(false);
      if (res.error) {
        setLiveError(res.error);
      } else {
        setLiveRows(res.rows);
        setLiveTotalRows(res.totalRows);
        setLiveExecutionMs(res.executionMs);
      }
    } else {
      setLiveRows([]);
      setLiveTotalRows(null);
      setLiveExecutionMs(null);
      setLiveError(null);
    }
  }, [
    currentSource?.connectionConfig,
    currentTable?.schema,
    currentTable?.tableName,
    pageSize,
    currentPage,
    sortColumn,
    sortDirection,
    filterText,
  ]);

  // Load data whenever table, page, sort, or filter changes
  useEffect(() => {
    if (isLive) {
      void loadLiveTableData();
    }
  }, [isLive, loadLiveTableData]);

  // Reset to page 1 whenever user switches source, table, changes filter text, or alters page size
  const handleFilterChange = (val: string) => {
    setFilterText(val);
    setCurrentPage(1);
  };

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setSortColumn(null);
    setSortDirection('asc');
    setFilterText('');
    setCurrentPage(1);
    onTableSelected?.(selectedSourceId, tableId);
  };

  const handleSelectSource = (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setSelectedTableId('');
    setSortColumn(null);
    setSortDirection('asc');
    setFilterText('');
    setCurrentPage(1);
    onTableSelected?.(sourceId, '');
  };

  // Toggle column sorting
  const handleToggleSort = (columnName: string) => {
    setCurrentPage(1);
    if (sortColumn === columnName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  // --- Client-Side processing for offline Excel / CSV tables ---
  const clientRows = useMemo(() => {
    if (isLive) return [];
    return currentTable?.rows || [];
  }, [isLive, currentTable]);

  const clientFilteredRows = useMemo(() => {
    if (isLive || clientRows.length === 0) return [];
    if (!filterText.trim()) return clientRows;

    const lower = filterText.toLowerCase();
    return clientRows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(lower)),
    );
  }, [isLive, clientRows, filterText]);

  const clientSortedRows = useMemo(() => {
    if (isLive) return [];
    const rows = [...clientFilteredRows];

    if (sortColumn) {
      rows.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined || valA === '') return 1;
        if (valB === null || valB === undefined || valB === '') return -1;

        const numA = Number(valA);
        const numB = Number(valB);

        if (!isNaN(numA) && !isNaN(numB) && typeof valA !== 'boolean' && typeof valB !== 'boolean') {
          return sortDirection === 'asc' ? numA - numB : numB - numA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return rows;
  }, [isLive, clientFilteredRows, sortColumn, sortDirection]);

  // --- Total records, total pages, and active visible rows ---
  const totalRecordCount = useMemo(() => {
    if (isLive) {
      return liveTotalRows ?? currentTable?.rowCountEstimate ?? 0;
    }
    return clientFilteredRows.length;
  }, [isLive, liveTotalRows, currentTable?.rowCountEstimate, clientFilteredRows.length]);

  const totalPages = Math.max(1, Math.ceil(totalRecordCount / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayRows = useMemo(() => {
    if (isLive) {
      return liveRows;
    }
    const start = (safeCurrentPage - 1) * pageSize;
    return clientSortedRows.slice(start, start + pageSize);
  }, [isLive, liveRows, clientSortedRows, safeCurrentPage, pageSize]);

  // Export CSV
  const handleExportCsv = () => {
    if (!currentTable || displayRows.length === 0) return;
    const colNames = currentTable.columns.map((c) => c.name);
    const headerLine = colNames.join(',');
    const rowLines = displayRows.map((r) =>
      colNames
        .map((c) => {
          const val = r[c] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(','),
    );
    const csvContent = [headerLine, ...rowLines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentTable.name}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Tables Sidebar */}
      <div className="w-64 border-r border-surface-border bg-surface p-4 flex flex-col gap-4 shrink-0">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
            Origen de Datos
          </label>
          <select
            value={currentSource?.id || ''}
            onChange={(e) => handleSelectSource(e.target.value)}
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
                onClick={() => handleSelectTable(table.id)}
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
                <span className="text-[10px] text-muted shrink-0 font-mono font-medium">
                  {typeof table.rowCountEstimate === 'number'
                    ? table.rowCountEstimate.toLocaleString()
                    : table.rows.length.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Data Grid Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Header Toolbar */}
        <div className="p-3.5 border-b border-surface-border bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-medium">{currentSource?.name} &gt;</span>
              <h2 className="text-base font-bold text-foreground">{currentTable?.name}</h2>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-success/10 text-success border border-success/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span>En Vivo {liveExecutionMs !== null ? `(${liveExecutionMs}ms)` : ''}</span>
                </span>
              )}
              <span className="text-xs text-muted font-normal">
                ({totalRecordCount.toLocaleString()} registros en total)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live PostgreSQL Refresh Button */}
            {isLive && (
              <button
                onClick={loadLiveTableData}
                disabled={isFetchingLive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-subtle shadow-sm transition-all disabled:opacity-50"
                title="Volver a consultar la base de datos PostgreSQL en vivo"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetchingLive ? 'animate-spin text-primary' : ''}`} />
                <span>Refrescar</span>
              </button>
            )}

            {/* Filter Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => handleFilterChange(e.target.value)}
                placeholder="Filtrar datos..."
                className="w-48 pl-8 pr-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              title="Descargar datos en formato CSV"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface text-xs font-medium text-muted hover:text-foreground hover:bg-surface-subtle shadow-sm transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>

            {/* Visual Builder Action */}
            <button
              onClick={() => {
                if (currentSource && currentTable) {
                  onOpenBuilderWithTable(currentSource.id, currentTable.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Crear Gráfico
            </button>
          </div>
        </div>

        {/* Data Grid Table View */}
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-xl border border-surface-border bg-surface shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-subtle border-b border-surface-border text-foreground font-bold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-2.5 px-3 text-muted w-14 text-center font-normal">#</th>
                  {currentTable?.columns.map((col) => {
                    const isSorted = sortColumn === col.name;
                    return (
                      <th
                        key={col.name}
                        onClick={() => handleToggleSort(col.name)}
                        className="py-2.5 px-3 font-semibold text-foreground cursor-pointer select-none hover:bg-surface-border/50 transition-colors"
                        title={`Ordenar por ${col.name} (${isSorted ? (sortDirection === 'asc' ? 'DESC' : 'Quitar') : 'ASC'})`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className={isSorted ? 'text-primary font-bold' : ''}>{col.name}</span>
                            <span className="text-[10px] font-normal text-muted uppercase">
                              ({col.type})
                            </span>
                          </div>
                          <div className="shrink-0 text-muted">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-30 hover:opacity-100" />
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {isFetchingLive ? (
                  <tr>
                    <td colSpan={(currentTable?.columns.length || 0) + 1} className="py-12 text-center text-muted">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-xs font-semibold">
                          Consultando página {safeCurrentPage} de PostgreSQL en vivo...
                        </span>
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
                ) : displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={(currentTable?.columns.length || 0) + 1} className="py-8 text-center text-muted text-xs">
                      No se encontraron registros en esta tabla.
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row, idx) => {
                    const rowNumber = (safeCurrentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-primary/[0.03] transition-colors text-foreground font-normal"
                      >
                        <td className="py-2 px-3 text-muted text-center text-[10px] font-mono select-none">
                          {rowNumber}
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Pagination & Records Footer */}
        <div className="border-t border-surface-border bg-surface px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Left: Rows Per Page & Record Info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted text-xs">Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-surface-border bg-surface-subtle px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <span className="text-muted">
              Mostrando{' '}
              <strong className="text-foreground">
                {totalRecordCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-foreground">
                {Math.min(safeCurrentPage * pageSize, totalRecordCount)}
              </strong>{' '}
              de <strong className="text-foreground">{totalRecordCount.toLocaleString()}</strong> registros
              {filterText && ` (filtrados)`}
            </span>
          </div>

          {/* Right: Server-Side Page Navigation across the entire dataset */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1 || isFetchingLive}
              title="Primera página"
              className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1 || isFetchingLive}
              title="Página anterior"
              className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="px-3 py-1 text-xs font-semibold text-foreground">
              Página {safeCurrentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages || isFetchingLive}
              title="Página siguiente"
              className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages || isFetchingLive}
              title="Última página"
              className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
