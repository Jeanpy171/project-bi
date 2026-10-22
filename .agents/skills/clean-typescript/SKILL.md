---
name: clean-typescript
description: >-
  Use this skill when writing or refactoring TypeScript code to ensure strict type safety, eliminate `any`, enforce Result/Either patterns, and validate boundaries with Zod.
---

# Clean TypeScript & Type Safety Skill

## 1. Zero `any` Principle & Alternatives

| Problematic Pattern | Recommended Solution |
| :--- | :--- |
| `const data: any = res.data;` | `const data: unknown = res.data; const parsed = MySchema.parse(data);` |
| `function handle(err: any)` | `function handle(err: unknown) { if (err instanceof Error) ... }` |
| `(x as any).property` | Use discriminated union or type guard: `function isRecord(val: unknown): val is Record<string, unknown>` |
| `Record<string, any>` | `Record<string, unknown>` or explicit schema definition |

## 2. Discriminated Unions for Domain Models

Always model complex state and variants as tagged unions:

```typescript
export type QueryResult =
  | { readonly status: 'success'; readonly columns: readonly Column[]; readonly rows: readonly Row[]; readonly executionMs: number }
  | { readonly status: 'error'; readonly code: QueryErrorCode; readonly message: string; readonly line?: number };
```

## 3. Typed Result Pattern for Controlled Errors

Never throw exceptions for predictable business/operational outcomes:

```typescript
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

## 4. Zod at Boundaries, Inferred Types in Domain

1. Define the schema at the boundary (HTTP request, env vars, database introspection).
2. Infer types using `z.infer<typeof MySchema>`.
3. Pass inferred domain types internally.
