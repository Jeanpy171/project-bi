---
name: git-workflow-versioning
description: >-
  Use this skill when preparing git commits, managing branches, releasing versions, or preventing git noise and technical debt.
---

# Git Workflow & Versioning Skill

## 1. Conventional Commits (Strict)
Every commit message must follow the Conventional Commits specification:

`<type>(<scope>): <subject>`

- **Types**:
  - `feat`: A new user-facing feature or capability.
  - `fix`: A bug fix.
  - `refactor`: Code change that neither fixes a bug nor adds a feature.
  - `perf`: Code change that improves performance.
  - `test`: Adding missing tests or correcting existing tests.
  - `docs`: Documentation changes only.
  - `chore`: Build process, tooling, or dependency updates.
- **Rules**:
  - NEVER include "Co-Authored-By" or AI attribution in commits.
  - Imperative mood, lowercase subject, no period at the end (e.g. `feat(connections): add postgres diagnostic helper`).

## 2. Semantic Versioning (SemVer)
- `MAJOR.MINOR.PATCH`
  - `MAJOR`: Breaking changes in contracts or database migrations.
  - `MINOR`: New backward-compatible features (e.g. adding a new chart type or connector).
  - `PATCH`: Backward-compatible bug fixes.

## 3. Atomic Commits
- Commit early and often in small logical units.
- Every commit on the main branch must pass linting, typechecking, and contract tests.
