# Implementation Plan: Connection References Page

**Branch**: `003-connection-references-page` | **Date**: 2026-07-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-connection-references-page/spec.md`

## Summary

Specialize the **Connection References** category of the shell (001). Implement the connection-references `CategoryModule`: load `connectionreference` records with server-side queries, render a details form (name, Connection, solutions, flows using it), group by Solution/Connector into a selectable forest (reusing the flows forest model), filter by managed/unmanaged, and provide bulk toolbar actions Change Connection, Add To Solution, and Merge. Merge requires choosing a master connection and is permitted only when all selected references share the same connector.

Technical approach: a `connectionReferencesModule` implementing `CategoryModule`, backed by Dataverse (`connectionreference`, `solutioncomponent`, `solution`, `workflow`) via `dataverseClient`, with `lib/batch.ts` for batched writes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — inherits 001.

**Primary Dependencies**: React 18, `@pptb/types`, shell adapters (`dataverseClient`, `toolboxHost`, `batch`), shared forest builder from 002/shell. No new runtime deps.

**Storage**: None app-owned. Reads/writes Dataverse `connectionreference`.

**Testing**: Vitest + RTL; mocked `dataverseAPI` with `connectionreference`/`solutioncomponent`/`workflow` fixtures; unit tests for the same-connector Merge gate, connection-picker filtering by connector, and selection de-dup across solution groups.

**Target Platform**: PPTB sandboxed iframe (via 001 shell).

**Project Type**: Single-project web app — adds `src/features/connection-references/`.

**Performance Goals**: Responsive with hundreds of references; grouping/filter on loaded data; batched writes.

**Constraints**: Host APIs only; server-side query/paging; managed references may reject writes (per-item failure, no abort); Merge blocked across differing connectors.

**Scale/Scope**: Hundreds of references; grouping up to 2 levels (Solution, Connector).

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Strict TS; small builders (mapping, connector-gate); no `any` | PASS |
| II. UX Consistency | Data via shell adapters; feedback via `toolboxAPI.utils`; pickers filtered to relevant connector | PASS |
| III. Performance | Server-side `connectionreference` query; batched Merge/Change/Add via `runBatched` (429 backoff) | PASS |
| IV. Minimal Comments & Small Functions | Merge validation + repoint decomposed into named functions | PASS |

**Result**: PASS. No violations — Complexity Tracking not required.

> **Performance note (Principle III)**: Loading the full set of connection references is intentional — grouping and Select All operate over the entire set, so this is the management scope, not a subset display. The `connectionreference` load is `$select`-limited and server-paged; the managed filter, grouping, and search are applied client-side over that loaded set. Bulk writes (Change Connection, Add To Solution, Merge) are batched with bounded concurrency + 429 backoff. This is a deliberate, documented trade-off consistent with the intent of Principle III.

## Project Structure

### Documentation (this feature)

```text
specs/003-connection-references-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── connection-references-module.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
PowerAutomateManager.PPTB/src/
├── features/connection-references/
│   ├── connectionReferencesModule.ts   # implements CategoryModule for 'connection-references'
│   ├── connRefQueries.ts               # FetchXML/OData for connectionreference + solutions + flows-using
│   ├── connRefDetails.ts               # record -> DetailField[] (name, Connection, solutions, flows using it)
│   ├── connRefGrouping.ts              # Solution/Connector GroupingOption
│   ├── connRefFilters.ts               # managed FilterControl
│   └── connRefActions.ts               # Change Connection, Add To Solution, Merge (ToolbarAction[])
└── categories/registry.ts              # registerCategory(connectionReferencesModule)
```

**Structure Decision**: Extends 001's single-project layout with `src/features/connection-references/`. Reuses the shared forest builder and selection model. Registered via the shell registry.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
