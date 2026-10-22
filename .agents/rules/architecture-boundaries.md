---
trigger: always_on
description: Architectural boundaries, dependency rules, and modular encapsulation.
---

# Architecture Boundaries Rules

This project follows a strict Modular Monolith with Hexagonal Architecture (Ports and Adapters).

## 1. Dependency Inversion & Hierarchy
- `apps/*` (e.g. `web`, `api`, `worker`) may import from `modules/*`, `packages/*`, and `plugins/*`.
- `modules/*` may import from `packages/*`.
- `packages/contracts` MUST NOT import from any other package, module, or app. It defines pure interfaces, DTOs, and Zod schemas (the Ports).
- `plugins/*` implement interfaces defined in `packages/contracts`. Plugins NEVER depend on `modules/*` or other plugins.
- Reverse dependencies are forbidden: `modules` or `packages` must NEVER import anything from `apps`.

```text
[apps] ──> [modules] ──> [packages/contracts] <── [plugins]
              │                  ▲
              ▼                  │
        [packages/kernel] ───────┘
```

## 2. Encapsulation & Public APIs
- Each package and module must expose its public contract strictly via `src/index.ts`.
- Deep internal imports (e.g. `import { foo } from '@bi/module/src/internal/private-file'`) are strictly prohibited and enforced via ESLint / package `exports`.
- Internal helper functions or infrastructure adapters must remain private to their module.
