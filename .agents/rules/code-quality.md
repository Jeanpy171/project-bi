---
trigger: always_on
description: Mandatory code quality, type-safety, and technical debt prevention rules.
---

# Code Quality & Type Safety Rules

These rules are strictly enforced across all packages and applications in this repository.

## 1. Zero Tolerance for `any`
- NEVER use `any` as a type annotation, return type, or cast.
- If a type is unknown or incoming from an external boundary (HTTP, database, user input), type it as `unknown` and validate/narrow it using **Zod schemas** or TypeScript type guards.
- Avoid loose `as Type` type assertions. Use type assertions ONLY when narrowing DOM nodes or interacting with third-party libraries that lack specific typings, and document why.
- Enable and respect `noImplicitAny: true` and `@typescript-eslint/no-explicit-any: error`.

## 2. Error Handling via Result Pattern
- Domain and application layers MUST NOT throw unexpected exceptions for predictable operational errors (e.g. database not found, invalid query syntax, connection timeout).
- Use typed `Result<T, E>` / `Either<L, R>` types from `@bi/kernel`.
- Exceptions (`throw`) are reserved exclusively for unrecoverable programmer errors / invariant violations.

## 3. Immutability and Pure Functions
- Treat domain entities and value objects as immutable (`readonly` properties).
- Use pure functions for business calculations, query transformations, and data aggregations.

## 4. No Dead Code or Premature Abstractions
- Do not leave unused imports, unreachable code branches, or commented-out code blocks.
- Adhere to YAGNI (You Aren't Gonna Need It): write abstractions only when there are at least two concrete use cases or when required by architectural boundaries (ports and adapters).
