# Implementation Plan: Flows Page

**Branch**: `002-flows-page` | **Date**: 2026-07-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-flows-page/spec.md`

## Summary

Specialize the **Flows** category of the Power Automate Manager shell (001). Implement the flows `CategoryModule`: load cloud flows (`workflow`) with server-side queries, render a details form (name, owner, solutions, connection references used, state), color-code rows by state (green On / red Off + non-color badge), group by Solution/State/Owner into a selectable forest with multi-level "Then by", filter by State and managed/unmanaged, and provide bulk toolbar actions Turn On, Turn Off, Change Owner, Add To Solution with per-flow success/failure reporting.

Technical approach: a `flowsModule` implementing the shell's `CategoryModule` contract, backed by Dataverse (`workflow`, `solutioncomponent`, `solution`, `connectionreference`) via `dataverseClient`, and using `lib/batch.ts` for bounded-concurrency, retry/backoff bulk writes.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — inherits 001.

**Primary Dependencies**: React 18, `@pptb/types`, `dataverseClient`/`toolboxHost`/`batch` from shell (001). No new runtime deps.

**Storage**: None app-owned. Reads/writes Dataverse `workflow` and solution membership via host `dataverseAPI`.

**Testing**: Vitest + RTL; mocked `dataverseAPI` returning `workflow`/`solutioncomponent` fixtures; unit tests for grouping-forest builder, selection de-dup across solution groups, and bulk-action failure reporting.

**Target Platform**: PPTB sandboxed iframe (via 001 shell).

**Project Type**: Single-project web app — adds `src/features/flows/` and registers the module.

**Performance Goals**: Responsive with hundreds of flows; grouping/selection operate on already-loaded, `$select`-limited data; bulk actions batched to avoid throttling.

**Constraints**: Host APIs only; server-side `$select`/`$filter`/`$top`; managed flows may reject writes (report as per-flow failure, don't abort batch).

**Scale/Scope**: Hundreds of flows across many solutions; up to 3 grouping levels.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Strict TS, small builders (grouping, mapping), no `any` | PASS |
| II. UX Consistency | Data via shell adapters only; feedback via `toolboxAPI.utils`; state shown with color **and** badge (theme-aware) | PASS |
| III. Performance | Server-side `workflow` query; client-side grouping/filter on loaded data; bulk writes via `runBatched` (bounded concurrency + 429 backoff) | PASS |
| IV. Minimal Comments & Small Functions | Grouping/forest logic decomposed into named functions | PASS |

**Result**: PASS. No violations — Complexity Tracking not required.

> **Performance note (Principle III)**: Loading the full set of flows is intentional — grouping and Select All operate over the entire set, so this is the management scope, not a subset display. The `workflow` load is `$select`-limited and server-paged; state color, filters, grouping, and search are applied client-side over that loaded set. Bulk writes are batched with bounded concurrency + 429 backoff. This is a deliberate, documented trade-off consistent with the intent of Principle III.

## Project Structure

### Documentation (this feature)

```text
specs/002-flows-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── flows-module.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
PowerAutomateManager.PPTB/src/
├── features/flows/
│   ├── flowsModule.ts          # implements CategoryModule for 'flows'
│   ├── flowQueries.ts          # FetchXML/OData for workflow + solution membership + conn refs
│   ├── flowDetails.ts          # record -> DetailField[] (name, owner, solutions, conn refs, state)
│   ├── flowRowStyle.ts         # state -> RowStyle (accent + badge)
│   ├── flowGrouping.ts         # Solution/State/Owner GroupingOption + forest keys
│   ├── flowFilters.ts          # State + managed FilterControls
│   └── flowActions.ts          # Turn On/Off, Change Owner, Add To Solution (ToolbarAction[])
└── categories/registry.ts      # registerCategory(flowsModule); grouping uses the shell-owned src/lib/grouping.ts (feature 001)
```

**Structure Decision**: Extends the 001 single-project structure with `src/features/flows/`. No new top-level projects. The module is registered in the shell's `categories/registry.ts`.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
