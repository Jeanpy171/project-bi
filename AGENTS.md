# Agent Guidelines for Proyecto BI

Welcome to Proyecto BI, an independent, extensible, customer-centric real-time Business Intelligence and Reporting platform built with TypeScript, React/Next.js, and Hexagonal Architecture.

## Core Non-Negotiables
1. **TypeScript Strict Mode**: Zero `any`. All external inputs validated with Zod. Strict null checks enabled.
2. **Ports & Adapters**: Domain logic lives in `modules/*`. All external drivers (Postgres, LLMs, chart renderers) are plugins implementing ports from `packages/contracts`.
3. **Spec-Driven**: Changes to features require contract specifications and scenarios before code implementation.
4. **Read-Only Customer Data**: Platform NEVER executes DDL or data mutations on user target databases. All SQL queries must pass AST validation for `SELECT` only with mandatory limits and timeouts.
5. **Git Hygiene**: Conventional Commits only (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`, `docs:`). No AI attribution or Co-Authored-By tags.
6. **Customer-Centric UI**: Polished modern design (Tailwind, shadcn/ui tokens, ECharts), mobile-first responsive layouts, full keyboard accessibility (WCAG 2.2 AA), zero tacky default colors.
