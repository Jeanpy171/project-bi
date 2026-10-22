---
name: api-contract-first
description: >-
  Use this skill when designing, implementing, or documenting HTTP APIs, RPC endpoints, and DTO contracts.
---

# API Contract-First Development Skill

## 1. Zod-First Contract Definition
All API contracts originate in `packages/contracts` as Zod schemas:

```typescript
import { z } from 'zod';

export const CreateConnectionSchema = z.object({
  name: z.string().min(1).max(100),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(5432),
  database: z.string().min(1),
  user: z.string().min(1),
  password: z.string().min(1),
  ssl: z.boolean().default(false),
});

export type CreateConnectionDto = z.infer<typeof CreateConnectionSchema>;
```

## 2. Standardized Response Envelope
All API endpoints must return a consistent payload structure:

```typescript
// Success Response
{
  "data": T,
  "meta"?: {
    "page"?: number,
    "total"?: number,
    "freshness"?: string
  }
}

// Error Response
{
  "error": {
    "code": "CONNECTION_TIMEOUT" | "INVALID_SQL_AST" | "UNAUTHORIZED" | "NOT_FOUND",
    "message": "Human-readable description in Spanish",
    "details"?: unknown
  }
}
```

## 3. OpenAPI Synchronization
- Use `@asteasolutions/zod-to-openapi` or Hono `zodOpenAPI` to automatically generate `openapi.yaml`.
- SDK in `packages/sdk` is auto-generated or typed directly from the Zod contracts.
- Maintain idempotency headers (`Idempotency-Key`) on critical mutating actions.
