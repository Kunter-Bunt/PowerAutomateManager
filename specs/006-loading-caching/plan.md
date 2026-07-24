# Implementation Plan: Non-Blocking Loading, Caching, and Per-Object Reload

**Branch**: `006-loading-caching` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-loading-caching/spec.md`

## Summary

Improve perceived performance and responsiveness of the shell (`001`) across all categories: (1) show a clearly visible, non-blocking spinner while a list loads; (2) cache each category's loaded objects for the session so switching back is instant; (3) run object operations without blocking the UI, showing a per-object busy spinner and reloading only the affected object(s) instead of the whole list.

Technical approach: add an in-memory, per-connection category cache consulted by the data hook; expose a way to patch individual items; track per-object "busy" ids in the shell; rework the toolbar-action flow to be non-blocking with a per-object concurrency guard and a per-object reload via a new optional `CategoryModule.reloadItem`. The three category modules implement `reloadItem` where a row's displayed data can change.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — inherits the existing tool.

**Primary Dependencies**: React 18, existing shell + features. No new dependencies.

**Storage**: In-memory, session-scoped cache only (not persisted).

**Testing**: Vitest + RTL. New unit tests for the cache store, non-blocking action flow, per-object reload/patch, and busy-guard; a component test that a cache hit renders without a loading state.

**Target Platform**: PPTB sandboxed iframe (unchanged).

**Project Type**: Single-project web app — edits to shell state/components + a small addition to each category module.

**Performance Goals**: Cache hit renders immediately (no loading state); UI stays interactive during multi-second operations; only affected rows re-fetch after an operation.

**Constraints**: Host APIs only; per-object concurrency guard; cache invalidated only by Refresh and connection change (no time expiry).

**Scale/Scope**: Shell data hook + action flow + list rendering; one optional method added to three category modules.

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Strict TS; small, named functions (cache store, patch, busy-guard); no `any` | PASS |
| II. UX Consistency | Theme-aware spinner via CSS variables; feedback still via `toolboxAPI.utils`; host APIs only | PASS |
| III. Performance | Non-blocking loads/operations; cache avoids reloads; per-object reload avoids whole-table refetch (server-side single-record retrieve) | PASS — directly advances Principle III |
| IV. Minimal Comments & Small Functions | Cache/busy/patch expressed as small named units | PASS |

**Result**: PASS. No violations — Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/006-loading-caching/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── loading-cache.md
└── checklists/requirements.md
```

### Source Code (files touched)

```text
PowerAutomateManager.PPTB/src/
├── state/
│   ├── categoryCache.ts        # NEW: in-memory per-(connection,category) ListItem[] cache
│   └── useCategoryData.ts      # cache-aware load; expose applyItemUpdates(); refresh clears cache
├── app/
│   ├── Spinner.tsx             # NEW: theme-aware spinner
│   ├── Shell.tsx               # busyIds state; non-blocking runAction; per-object reload; concurrency guard
│   ├── ObjectList.tsx          # per-row busy spinner (busyIds prop)
│   ├── GroupedList.tsx         # per-row busy spinner (busyIds prop)
│   └── DetailsPanel.tsx        # (unchanged; details reflect data on reselect)
├── models/
│   └── types.ts                # CategoryModule gains optional reloadItem(id, ctx)
├── features/flows/flowsModule.ts               # implement reloadItem (retrieve workflow row)
├── features/connection-references/connectionReferencesModule.ts  # implement reloadItem (retrieve connectionreference row)
└── features/connections/connectionsModule.ts   # reloadItem optional/omitted (share doesn't change row)
└── styles.css                  # spinner + busy-row styles
```

**Structure Decision**: Extend the existing single-project layout. The shell owns the cache, busy-state, and non-blocking action flow; each category module optionally contributes `reloadItem` for per-object refresh. No new top-level projects or dependencies.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
