'use client';

import { useState } from 'react';
import {
  BarChart2,
  ChevronDown,
  Database,
  FileSpreadsheet,
  FolderOpen,
  Home,
  Layers,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Table as TableIcon,
} from 'lucide-react';

export type AppView = 'dashboards' | 'browse' | 'builder' | 'connections';

interface SidebarProps {
  readonly currentView: AppView;
  readonly onViewChange: (view: AppView) => void;
  readonly isDarkMode: boolean;
  readonly onToggleDarkMode: () => void;
  readonly onOpenConnectionModal: () => void;
  readonly onOpenUploadExcel: () => void;
  readonly activeSourcesCount: number;
}

export function Sidebar({
  currentView,
  onViewChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenConnectionModal,
  onOpenUploadExcel,
  activeSourcesCount,
}: SidebarProps) {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  const navItems: { id: AppView; label: string; icon: typeof Home }[] = [
    { id: 'dashboards', label: 'Dashboards', icon: Layers },
    { id: 'browse', label: 'Explorador de Datos', icon: TableIcon },
    { id: 'builder', label: 'Constructor Visual', icon: BarChart2 },
    { id: 'connections', label: 'Bases de Datos', icon: Database },
  ];

  return (
    <aside className="w-64 border-r border-surface-border bg-surface flex flex-col h-screen select-none shrink-0 transition-colors">
      {/* Brand & Workspace */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm font-bold text-sm">
            BI
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-foreground block">
              Proyecto BI
            </span>
            <span className="text-[11px] text-muted block -mt-0.5">Espacio Principal</span>
          </div>
        </div>

        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg border border-surface-border text-muted hover:text-foreground hover:bg-surface-subtle transition-colors"
          title="Cambiar tema"
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Quick Action Button & Search */}
      <div className="p-3 space-y-2 border-b border-surface-border bg-surface-subtle/50 relative">
        <div className="relative">
          <button
            onClick={() => setIsNewMenuOpen((prev) => !prev)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all"
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>+ Nuevo</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isNewMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Metabase Page 17 style "+ Nuevo" Popover Menu */}
          {isNewMenuOpen && (
            <div className="absolute left-3 right-3 top-12 z-50 rounded-xl border border-surface-border bg-surface p-1.5 shadow-xl space-y-1">
              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  onViewChange('builder');
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-foreground font-medium hover:bg-surface-subtle transition-colors text-left"
              >
                <BarChart2 className="h-4 w-4 text-primary" />
                <div>
                  <span className="block font-semibold">Pregunta / Gráfico</span>
                  <span className="text-[10px] text-muted block">Constructor visual asistido</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  onViewChange('dashboards');
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-foreground font-medium hover:bg-surface-subtle transition-colors text-left"
              >
                <Layers className="h-4 w-4 text-accent" />
                <div>
                  <span className="block font-semibold">Dashboard</span>
                  <span className="text-[10px] text-muted block">Nuevo lienzo ejecutivo</span>
                </div>
              </button>

              <div className="border-t border-surface-border my-1" />

              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  onOpenUploadExcel();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-foreground font-medium hover:bg-surface-subtle transition-colors text-left"
              >
                <FileSpreadsheet className="h-4 w-4 text-success" />
                <div>
                  <span className="block font-semibold">Subir Excel / CSV</span>
                  <span className="text-[10px] text-muted block">Análisis en memoria</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  onOpenConnectionModal();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-foreground font-medium hover:bg-surface-subtle transition-colors text-left"
              >
                <Database className="h-4 w-4 text-primary" />
                <div>
                  <span className="block font-semibold">Conectar BDD</span>
                  <span className="text-[10px] text-muted block">PostgreSQL con diagnóstico</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tablas, reportes..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-surface-border bg-surface text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 text-xs">
        {/* Main Sections */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            Vistas Principales
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/80 hover:bg-surface-subtle hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Collections & Folders (Inspired by Metabase Page 11-13) */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            Colecciones
          </span>
          <button
            onClick={() => onViewChange('dashboards')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-foreground/80 hover:bg-surface-subtle transition-all"
          >
            <FolderOpen className="h-4 w-4 text-muted" />
            <span>Nuestros análisis</span>
          </button>
          <button
            onClick={() => onViewChange('dashboards')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-foreground/80 hover:bg-surface-subtle transition-all"
          >
            <FolderOpen className="h-4 w-4 text-muted" />
            <span>Colección personal</span>
          </button>
        </div>

        {/* AI & Smart Queries */}
        <div className="space-y-1">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
            Inteligencia
          </span>
          <button
            onClick={() => onViewChange('builder')}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-foreground/80 hover:bg-surface-subtle transition-all"
          >
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Consultas asistidas</span>
          </button>
        </div>
      </div>

      {/* Footer Status Pill */}
      <div className="p-3 border-t border-surface-border bg-surface-subtle/40 text-[11px]">
        <button
          onClick={() => onViewChange('connections')}
          className="w-full flex items-center justify-between text-muted hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            {activeSourcesCount} Orígenes listos
          </span>
          <span className="font-semibold text-foreground text-[10px] hover:underline">Ver todos &rarr;</span>
        </button>
      </div>
    </aside>
  );
}
