# Constitution & Architecture Principles: Proyecto BI

This document represents the immutable technical foundation for Proyecto BI. Every architectural decision, code change, and agent task must adhere to these principles.

## 1. Technical Stack
- **Language**: TypeScript (strict mode, zero `any`, Node 22+).
- **Monorepo**: pnpm workspaces + Turborepo.
- **Frontend**: Next.js (App Router), React, Tailwind CSS, shadcn/ui design tokens, Zustand, Apache ECharts.
- **Backend / BFF**: Hono or Fastify with Zod OpenAPI.
- **Metadata Database**: PostgreSQL with Drizzle ORM + pgvector.
- **Cache & Real-time**: Redis + Server-Sent Events (SSE).
- **Analytical Engines**: Remote Read-Only Databases (Postgres MVP) + In-Process DuckDB (WASM / Node) for ad-hoc datasets & CSVs.
- **AI Layer**: Vercel AI SDK (`@ai-sdk/google` for Gemini) + Ollama provider for local privacy-first inference. Tool registry defined once with Zod.

## 2. Non-Negotiable Architectural Rules
1. **Dependency Direction**:
   - `apps` -> `modules` -> `packages/contracts`
   - `plugins` -> `packages/contracts`
   - No cyclic imports, no reverse imports.
2. **Read-Only Guarantee**:
   - User database connections are restricted to `SELECT` queries strictly validated via AST parser (`pgsql-parser` or `node-sql-parser`).
   - Forced `LIMIT` clauses, execution timeouts (`statement_timeout`), and read-only transactions.
3. **Parity between Manual and AI**:
   - The AI never has privileged capabilities unavailable to the manual visual builder.
   - Both manual queries and AI-generated queries compile to the same Intermediate Representation (Query IR) and produce editable draft visual cards.
4. **Resilience & Graceful Degradation**:
   - If AI provider is unavailable or unconfigured, 100% of the platform must function flawlessly in manual mode.
   - All asynchronous tasks (schema sync, heavy exports) run through background workers (BullMQ).
