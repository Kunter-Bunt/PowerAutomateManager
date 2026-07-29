# Implementation Plan: Connections Page

**Branch**: `004-connections-page` | **Date**: 2026-07-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-connections-page/spec.md`

## Summary

Specialize the **Connections** category of the shell (001). Implement the connections `CategoryModule`: list connections via the Power Platform API, render a details form (name, owner, flows using it), group by Owner/Connector into a selectable forest, expose no category filters (only the shell's search box), and provide a Share toolbar action that lets the user select Service Principals as targets and grants them access to the selected connections using each target's Enterprise Application ID, with per-connection success/failure reporting.

Technical approach: a `connectionsModule` implementing `CategoryModule`, backed by `powerPlatformClient` (Connectivity namespace) for connection data and the Power Apps for Admins namespace for connection permissions, plus reuse of the connection↔connection-reference↔flow index (002/003) for "flows using it". Bulk share uses `lib/batch.ts` and targets only Service Principals identified by their Enterprise Application IDs.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — inherits 001.

**Primary Dependencies**: React 18, `@pptb/types`, shell adapters (`powerPlatformClient`, `dataverseClient`, `toolboxHost`, `batch`), shared forest builder. No new runtime deps.

**Storage**: None app-owned. Reads connections via `powerplatformAPI.Connectivity`, reads connection role assignments and grants permissions via the Power Apps for Admins API, and reads Dataverse for the flows-using cross-reference.

**Testing**: Vitest + RTL; mocked `powerplatformAPI` (Connectivity and Power Apps for Admins connection permissions) and `dataverseAPI` (connection references / flows); unit tests for Service Principal resolution, Enterprise Application ID payloads, per-connection failure aggregation, and the enabled-for-PP-API degraded state.

**Target Platform**: PPTB sandboxed iframe (via 001 shell).

**Project Type**: Single-project web app — adds `src/features/connections/`.

**Performance Goals**: Responsive with hundreds of connections; grouping on loaded data; batched share to avoid throttling.

**Constraints**: Host APIs only; the active connection must expose both Connectivity and Power Apps for Admins namespaces and have `connection.enabledForPowerPlatformAPI` enabled; server-side query where the API supports it. Service Principal discovery is limited to principals returned by the connection permissions endpoint; Teams and individual users are excluded.

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
│   ├── connectionQueries.ts     # powerplatformAPI Connectivity list + owner/API/environment mapping
│   ├── connectionDetails.ts     # record -> DetailField[] (name, owner, flows using it)
│   ├── connectionGrouping.ts    # Owner/Connector GroupingOption
│   └── connectionShare.ts       # Share action + Service Principal picker + Enterprise Application ID grant
└── categories/registry.ts       # registerCategory(connectionsModule)
```

**Structure Decision**: Extends 001's single-project layout with `src/features/connections/`. Uses `powerPlatformClient` for connection data/sharing and reuses shared forest/selection. Registered via the shell registry.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
