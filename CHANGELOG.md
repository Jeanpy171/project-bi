# Changelog

All notable changes to **Proyecto BI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-10-22

### Added

#### Executive PDF Export System
- **Interactive A4 Live Preview Modal (`ExportPdfModal`)**: Dedicated export interface with real-time sheet preview, accurate A4 aspect ratio rendering, and clean print support.
- **Page Estimation & Output Control**: Real-time page count calculation (`1 Hoja A4` vs `2 Hojas A4`) with support for two distribution modes:
  - *Ajustar a 1 Hoja*: Proportional fit-to-page scaling without vertical cuts.
  - *Paginado por Secciones*: Two-page clean breakdown between executive KPIs and detailed data tables.
- **Three-Way High-Contrast Themes**:
  - *Blanco Puro*: Crisp `#ffffff` canvas with slate borders for economical toner/ink printing.
  - *Gris Ejecutivo*: High-contrast `#f1f5f9` slate background with elevated white cards and subtle drop shadows.
  - *Pizarra Dark*: Sleek `#0f172a` executive dark presentation mode.

#### Visual Builder Studio (3-Column Layout)
- **Integrated Workspace (`VisualBuilderView`)**: Migrated chart builder from a restrictive modal into an integrated 3-column canvas (query/metric controls left, live chart preview center, visualization catalog drawer right).
- **Collapsible Visualization Catalog Drawer (`ChartCatalogDrawer`)**: Categorized visual palette with instant 1-click preview and non-blocking selection.
- **Expanded Chart Contracts (`@bi/contracts`)**: Formalized contracts for Radial Gauge (`gauge`), Conversion Funnel (`funnel`), Gradient Area (`area`), and Ranking Bar (`bar_horizontal`).

### Changed

#### Light Mode Visual Depth & Contrast (Stripe & Linear Aesthetics)
- **Executive Desk Canvas**: Updated light-mode background token to a soft slate tint (`bg-slate-100/70` / `#f1f5f9`), eliminating stark white-on-white monotony.
- **Physical Card Shadows (`.card-executive`)**: Implemented multi-layered physical drop shadows (`0 12px 24px -4px rgba(15,23,42,0.08)`) and `#cbd5e1` borders.
- **Volumetric Chart Curves & Shadows (`chart-theme.ts`)**:
  - Added colored drop shadows (`shadowBlur: 12`, `shadowOffsetY: 6`) to line and area curves.
  - Implemented 3-stop rich gradient area fills (`0.42` → `0.20` → `0.02`).
  - Switched chart gridlines to subtle dashed styling (`type: 'dashed'`).
  - Added volumetric gradients and ambient shadows to bar and horizontal bar series.
  - Enhanced donut charts with 3D segment borders, `padAngle: 4`, and pillowy depth.
- **KPI Card Identity**: Added 3.5px accent-colored top border tabs and bold typography to KPI cards.

### Fixed
- **Expanded Chart Blank Modal**: Resolved issue in `CardExpandModal` where maximizing cards caused ECharts to receive empty options by implementing fallback resolution for all chart kinds.
- **PDF Title Duplication & Margin Sizing**: Excluded in-app top action bar from PDF capture to prevent title repetition and calibrated capture container to A4 proportions (`1120px` landscape / `800px` portrait), preventing microscopic text.
- **Card Title Ascender Clipping**: Added safe padding to section and card header typography to eliminate cut-off letter glyphs.

---

## [0.1.0] - 2026-10-22

### Added

#### Core Architecture & Hexagonal Boundaries
- **`packages/kernel`**: Implemented strict functional `Result<T, E>` pattern (`ok`, `err`, `isOk`, `isErr`, `map`, `mapErr`) to eliminate unhandled operational exceptions across domain and application layers.
- **`packages/contracts`**: Defined pure contracts, Zod schemas, and TypeScript interfaces for data source connectors, diagnostic reports, AST query definitions, and dashboard documents without external infrastructure dependencies.
- **`packages/query-ir`**: Created AST query validator enforcing strict read-only execution (`SELECT` only, no DDL/DML, blocking comments and stacked queries) with automatic compilation to PostgreSQL SQL with mandatory limits and timeouts.
- **`plugins/connector-postgres`**: Built dedicated PostgreSQL driver implementing `DataSourceConnector` with schema introspection, metadata extraction, and guided network diagnostics.
- **`infra/`**: Configured Docker Compose environment with PostgreSQL 16 + pgvector, Redis caching layer, and demo retail/financial database on port 5433 seeded with hierarchical accounting data (*Plan de Cuentas*).

#### Backend API (`apps/api`)
- **Hono OpenAPI BFF**: Deployed high-performance Hono server running on port 3001 with interactive OpenAPI 3.1.0 specification (`/doc`).
- **Connection Diagnostics Endpoint (`POST /api/connections/test`)**: Guided assistant diagnosing DNS resolution, TCP port accessibility, authentication, and Docker network bridge routing (e.g. `host.docker.internal`).
- **Schema Introspection Endpoint (`POST /api/connections/introspect`)**: Automated table, view, column type, and foreign key inspection.
- **Safe Query Runner (`POST /api/queries/run` & `POST /api/queries/compile`)**: AST validation and read-only query execution.

#### Metabase-Grade Modular UI (`apps/web`)
- **Persistent Workspace Navigation Sidebar (`Sidebar`)**: Metabase-inspired navigation separating distinct spaces (*Dashboards*, *Explorador de Datos*, *Constructor Visual*, *Bases de Datos*) with an interactive `+ Nuevo` action menu and theme toggle.
- **Explorador de Datos (`DataBrowserView`)**: Dedicated full-screen data grid with table selector, column type badges, real-time search/filtering, and instant action to create visual charts from the selected table.
- **Constructor Visual de Preguntas (`VisualBuilderView`)**: Dedicated visualization workspace with a left configuration drawer (dimension mapping, metric selection, aggregations: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`) and a bottom chart switcher (*Barras*, *Líneas*, *Donut*, *KPI*, *Tabla*).
- **Lector de Archivos Excel y CSV en Memoria (`ExcelUploadModal`)**: Client-side drag-and-drop parsing using SheetJS (`xlsx`) for instant analysis without database setup.
- **Tablero Ejecutivo (`DashboardCanvas`)**: Clean executive canvas displaying KPI metric cards, hierarchical financial accounting balance table, and dynamic custom cards.
- **Centro de Orígenes y Diagnóstico (`ConnectionsView`)**: Comprehensive database overview with proactive connectivity testing.

#### Chart Theming Engine (`chart-theme.ts`)
- **Curated High-Contrast SaaS Palette**: Modern, accessible color system for light and dark modes avoiding tacky defaults.
- **Grounded Baselines & Subtle Dashed Grids**: Restructured ECharts axes with clean category baselines and delicate dashed gridlines at 45% opacity, eliminating harsh solid lines and low-contrast borders.
- **Single Source of Truth Theme Reactivity**: Unified `isDarkMode` state flow with complete ECharts canvas instance disposal and re-initialization on toggle, guaranteeing 1-click theme switching without desynchronization.

#### Agent Quality & Governance
- **`AGENTS.md`**: Strict non-negotiables (zero `any`, Zod boundary validation, read-only customer data, Conventional Commits).
- **Reusable Skills**: `.agents/skills/` (`clean-typescript`, `frontend-responsive-ui`, `api-contract-first`, `git-workflow-versioning`).
