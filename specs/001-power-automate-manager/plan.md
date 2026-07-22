# Implementation Plan: Power Automate Manager (Tool Shell)

**Branch**: `001-power-automate-manager` | **Date**: 2026-07-22 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-power-automate-manager/spec.md`

## Summary

Build the shared shell of a Power Platform ToolBox (PPTB) tool that lets users browse Power Automate objects by category. The shell provides a left navigation (Flows, Connection References, Connections), a main list per category, a right details panel, CTRL/SHIFT multi-select, a common toolbar (Refresh, Select All, Clear Selection), and a filter/group/sort bar containing a search box. Category-specific behavior (detail fields, grouping, filters, bulk actions) is delivered by features 002–004 through extension points this shell defines.

Technical approach: a single-page TypeScript app running in the PPTB sandboxed iframe, built with Vite and React, reading data exclusively through the sanctioned host APIs (`window.toolboxAPI`, `window.dataverseAPI`, `window.powerplatformAPI`). Lists use server-side FetchXML/OData queries and UI virtualization to stay responsive at hundreds of objects. The shell is designed around a `CategoryModule` contract so each category (feature) plugs in its own data provider, list columns, details form, toolbar actions, grouping, and filters without modifying the shell.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)

**Primary Dependencies**: React 18, Vite 5, `@pptb/types`, `@tanstack/react-virtual` (list virtualization)

**Storage**: No app-owned storage. Tool-scoped UI preferences (if any) via `toolboxAPI.settings`. All domain data lives in Dataverse / Power Platform, accessed read-only through host APIs.

**Testing**: Vitest + React Testing Library for unit/component tests; host APIs (`toolboxAPI`, `dataverseAPI`, `powerplatformAPI`) mocked via a typed test double. Contract tests assert the `CategoryModule` and host-adapter interfaces.

**Target Platform**: PPTB desktop host (Electron) — tool runs as a sandboxed iframe web app; theme-aware (light/dark).

**Project Type**: Single-project web app (frontend only; no custom backend — the host mediates all data access).

**Performance Goals**: UI stays interactive (no frozen frames) while loading/refreshing hundreds of objects; single-object interactions feel instant (<2s excluding service latency, per constitution III).

**Constraints**: Sandboxed iframe — no direct network calls; host APIs only. Server-side filtering/paging required. Icons use `currentColor`. No secrets/credentials persisted.

**Scale/Scope**: Environments with hundreds of Flows / Connection References / Connections. Three categories, one shell, ~3 shared surfaces (list, details, toolbar/filter bar).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Strict TS (no `any`), ESLint + Prettier zero-error, small single-responsibility modules, no dead code | PASS — enforced by tsconfig strict + lint config; architecture splits shell into small components/services |
| II. UX Consistency | Data only via `toolboxAPI`/`dataverseAPI`/`powerplatformAPI`; connection read-only from `toolboxAPI.connections`; feedback via `toolboxAPI.utils`; theme-aware `currentColor`; settings via `toolboxAPI.settings`; manifest top-level `icon` + `@pptb/types` | PASS — host-adapter layer is the only data path; no direct fetch; notifications via `utils.showNotification` |
| III. Performance | Server-side FetchXML/OData `$select`/`$filter`/`$top`; virtualized lists; non-blocking loads; batched bulk ops with bounded concurrency + retry/backoff (bulk lives in 002–004) | PASS — shell provides async, cancellable load + virtualization; write batching contract defined for category features |
| IV. Minimal Comments & Small Functions | Comments explain WHY only; extract named functions over segmented long functions | PASS — enforced in review; lint rule for function length guidance |

**Result**: PASS (initial and post-design). No violations — Complexity Tracking not required.

> **Performance note (Principle III)**: Loading the full per-category object set is intentional — grouping and Select All operate over the entire set, so this is the tool's management scope, not a subset display. The load is `$select`-limited and server-paged; search, filter, and grouping are then applied client-side over that loaded set. This is a deliberate, documented trade-off consistent with the intent of Principle III (no whole-table fetch to show a mere subset).

## Project Structure

### Documentation (this feature)

```text
specs/001-power-automate-manager/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal interface contracts)
│   ├── category-module.md
│   ├── host-adapters.md
│   └── manifest.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
PowerAutomateManager.PPTB/
├── package.json                 # PPTB manifest (top-level icon, @pptb/types, features.minAPI)
├── index.html                   # tool entry (main)
├── vite.config.ts
├── tsconfig.json                # strict
├── .eslintrc.cjs / .prettierrc
├── public/
│   └── icons/power-automate-manager.svg   # currentColor
├── src/
│   ├── main.tsx                 # bootstraps React into #app
│   ├── app/
│   │   ├── Shell.tsx            # layout: nav + toolbar + filter bar + list + details
│   │   ├── NavigationBar.tsx    # Flows / Connection References / Connections
│   │   ├── Toolbar.tsx          # common actions + slot for category actions
│   │   ├── FilterBar.tsx        # search box + slot for category filters/grouping
│   │   ├── ObjectList.tsx       # virtualized list, multi-select gestures
│   │   └── DetailsPanel.tsx     # renders active CategoryModule details form
│   ├── categories/
│   │   └── registry.ts          # registers CategoryModule implementations (002–004 add here)
│   ├── services/
│   │   ├── toolboxHost.ts       # wraps window.toolboxAPI (connection, utils, settings, events)
│   │   ├── dataverseClient.ts   # wraps window.dataverseAPI (query/execute + paging)
│   │   └── powerPlatformClient.ts # wraps window.powerplatformAPI (namespaced)
│   ├── state/
│   │   ├── SelectionModel.ts    # CTRL/SHIFT/plain-click selection, de-dup, reset-on-category
│   │   └── useCategoryData.ts   # load/refresh/search/error/empty state per category
│   ├── models/
│   │   └── types.ts             # CategoryId, ListItem, DetailField, ToolbarAction, etc.
│   └── lib/
│       ├── batch.ts             # bounded-concurrency + retry/backoff (used by 002–004)
│       ├── grouping.ts          # shell-owned multi-level forest builder (used by 002–004)
│       └── theme.ts             # theme-aware helpers
└── tests/
    ├── unit/                    # SelectionModel, batch, clients (mocked host)
    └── component/               # Shell, ObjectList, DetailsPanel
```

**Structure Decision**: Single-project frontend web app in `PowerAutomateManager.PPTB/`. There is no custom backend; the PPTB host mediates all data access, so a web-application split (frontend/backend) is unnecessary. The shell (this feature) owns `app/`, `services/`, `state/`, `models/`, `lib/`; category features (002–004) add modules under `src/categories/` and `src/features/<category>/` and register them via `categories/registry.ts`.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
