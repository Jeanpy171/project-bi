# Changelog

All notable changes to **Proyecto BI** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
