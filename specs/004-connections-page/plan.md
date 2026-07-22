# Implementation Plan: Connections Page

**Branch**: `004-connections-page` | **Date**: 2026-07-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-connections-page/spec.md`

## Summary

Specialize the **Connections** category of the shell (001). Implement the connections `CategoryModule`: list connections via the Power Platform API, render a details form (name, owner, flows using it), group by Owner/Connector into a selectable forest, expose no category filters (only the shell's search box), and provide a Share toolbar action that lets the user select Users, Teams, and S2S Apps as targets and grants them access to the selected connections with per-connection success/failure reporting.

Technical approach: a `connectionsModule` implementing `CategoryModule`, backed by `powerPlatformClient` (Connectivity namespace) for connection data and sharing, plus reuse of the connection↔connection-reference↔flow index (002/003) for "flows using it". Bulk share uses `lib/batch.ts`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — inherits 001.

**Primary Dependencies**: React 18, `@pptb/types`, shell adapters (`powerPlatformClient`, `dataverseClient`, `toolboxHost`, `batch`), shared forest builder. No new runtime deps.

**Storage**: None app-owned. Reads connections and grants permissions via `powerplatformAPI`; reads Dataverse for the flows-using cross-reference.

**Testing**: Vitest + RTL; mocked `powerplatformAPI` (connections + permissions) and `dataverseAPI` (connection references / flows); unit tests for the multi-type share-target selection, per-connection failure aggregation, and the enabled-for-PP-API degraded state.

**Target Platform**: PPTB sandboxed iframe (via 001 shell).

**Project Type**: Single-project web app — adds `src/features/connections/`.

**Performance Goals**: Responsive with hundreds of connections; grouping on loaded data; batched share to avoid throttling.

**Constraints**: Host APIs only; `powerplatformAPI` requires `connection.enabledForPowerPlatformAPI` (degrade gracefully when off); server-side query where the API supports it.

**Scale/Scope**: Hundreds of connections; grouping up to 2 levels (Owner, Connector).

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Strict TS; small builders (mapping, share-target resolution); no `any` | PASS |
| II. UX Consistency | Data via shell `powerPlatformClient`/`dataverseClient`; feedback via `toolboxAPI.utils`; graceful degrade when PP API disabled | PASS |
| III. Performance | Server-side/paged connection query; batched share via `runBatched` (429 backoff) | PASS |
| IV. Minimal Comments & Small Functions | Share principal resolution + grant decomposed into named functions | PASS |

**Result**: PASS. No violations — Complexity Tracking not required.

> **Performance note (Principle III)**: Loading the full set of connections is intentional — grouping and Select All operate over the entire set, so this is the management scope, not a subset display. The connection load (Power Platform API) is paged where supported; grouping and search are applied client-side over that loaded set. Share is batched with bounded concurrency + 429 backoff. This is a deliberate, documented trade-off consistent with the intent of Principle III.

## Project Structure

### Documentation (this feature)

```text
specs/004-connections-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── connections-module.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
PowerAutomateManager.PPTB/src/
├── features/connections/
│   ├── connectionsModule.ts     # implements CategoryModule for 'connections'
│   ├── connectionQueries.ts     # powerplatformAPI Connectivity list + owner mapping
│   ├── connectionDetails.ts     # record -> DetailField[] (name, owner, flows using it)
│   ├── connectionGrouping.ts    # Owner/Connector GroupingOption
│   └── connectionShare.ts       # Share action + principal picker (Users/Teams/S2S apps) + grant
└── categories/registry.ts       # registerCategory(connectionsModule)
```

**Structure Decision**: Extends 001's single-project layout with `src/features/connections/`. Uses `powerPlatformClient` for connection data/sharing and reuses shared forest/selection. Registered via the shell registry.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
