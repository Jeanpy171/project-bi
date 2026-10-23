'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [liveTotalRows, setLiveTotalRows] = useState<number | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveExecutionMs, setLiveExecutionMs] = useState<number | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveQueryLimit, setLiveQueryLimit] = useState<number>(100);

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

  const loadLiveTableData = async () => {
    if (currentSource?.connectionConfig && currentTable?.schema && currentTable?.tableName) {
      setIsFetchingLive(true);
      setLiveError(null);
      const res = await fetchPostgresTableRows(
        currentSource.connectionConfig,
        currentTable.schema,
        currentTable.tableName,
        liveQueryLimit,
      );
      setIsFetchingLive(false);
      if (res.error) {
        setLiveError(res.error);
      } else {
        setLiveRows(res.rows);
        setLiveTotalRows(res.totalRows ?? null);
        setLiveExecutionMs(res.executionMs);
      }
    } else {
      setLiveRows([]);
      setLiveTotalRows(null);
      setLiveExecutionMs(null);
      setLiveError(null);
    }
  };

  useEffect(() => {
    loadLiveTableData();
  }, [currentSource?.id, currentTable?.id, liveQueryLimit]);

  // Reset pagination when source, table, filter, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSourceId, selectedTableId, filterText, pageSize]);

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

  // Sort filtered rows
  const processedRows = useMemo(() => {
    const rows = [...filteredRows];

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
  }, [filteredRows, sortColumn, sortDirection]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, safeCurrentPage, pageSize]);

  const handleToggleSort = (columnName: string) => {
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

  const handleExportCsv = () => {
    if (!currentTable || processedRows.length === 0) return;
    const colNames = currentTable.columns.map((c) => c.name);
    const headerLine = colNames.join(',');
    const rowLines = processedRows.map((r) =>
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
              {currentSource?.connectionConfig && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-success/10 text-success border border-success/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span>En Vivo {liveExecutionMs !== null ? `(${liveExecutionMs}ms)` : ''}</span>
                </span>
              )}
              <span className="text-xs text-muted font-normal">
                {currentSource?.connectionConfig
                  ? `(Cargadas ${activeRows.length} de ${(liveTotalRows ?? currentTable?.rowCountEstimate ?? activeRows.length).toLocaleString()} filas en base de datos)`
                  : `(${filteredRows.length} de ${currentTable?.rows.length || 0} filas)`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live PostgreSQL Query Limit Selector */}
            {currentSource?.connectionConfig && (
              <div className="flex items-center gap-1.5 bg-surface-subtle border border-surface-border rounded-lg px-2 py-1 text-xs">
                <span className="text-[11px] text-muted">Límite:</span>
                <select
                  value={liveQueryLimit}
                  onChange={(e) => setLiveQueryLimit(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value={50}>50 filas</option>
                  <option value={100}>100 filas</option>
                  <option value={250}>250 filas</option>
                  <option value={500}>500 filas</option>
                  <option value={1000}>1000 filas</option>
                  <option value={5000}>Hasta 5000 filas (Todas)</option>
                </select>
                <button
                  onClick={loadLiveTableData}
                  disabled={isFetchingLive}
                  className="p-1 text-muted hover:text-foreground transition-colors disabled:opacity-50"
                  title="Refrescar consulta con este límite"
                >
                  <RefreshCw className={`h-3 w-3 ${isFetchingLive ? 'animate-spin text-primary' : ''}`} />
                </button>
              </div>
            )}

            {/* Filter Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filtrar datos..."
                className="w-44 pl-8 pr-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
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
                  <th className="py-2.5 px-3 text-muted w-12 text-center font-normal">#</th>
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
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={(currentTable?.columns.length || 0) + 1} className="py-8 text-center text-muted text-xs">
                      No se encontraron registros en esta tabla.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
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
                onChange={(e) => setPageSize(Number(e.target.value))}
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
                {processedRows.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-foreground">
                {Math.min(safeCurrentPage * pageSize, processedRows.length)}
              </strong>{' '}
              de <strong className="text-foreground">{processedRows.length}</strong> filas cargadas
              {currentSource?.connectionConfig && (
                <span>
                  {' '}• Total en BDD:{' '}
                  <strong className="text-foreground">
                    {(liveTotalRows ?? currentTable?.rowCountEstimate ?? processedRows.length).toLocaleString()}
                  </strong>
                </span>
              )}
              {filterText && ` (filtrados de ${activeRows.length})`}
            </span>
          </div>

          {/* Right: Page Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              title="Primera página"
              className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
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
              disabled={safeCurrentPage >= totalPages}
              title="Página siguiente"
              className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
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
