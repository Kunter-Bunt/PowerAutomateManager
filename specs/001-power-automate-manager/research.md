# Research: Power Automate Manager (Tool Shell)

**Feature**: 001-power-automate-manager | **Date**: 2026-07-22 | **Phase**: 0

All decisions follow the PPTB documented best practices (docs.powerplatformtoolbox.com) and the project constitution.

## Decision 1 — Runtime & build

**Decision**: TypeScript 5 (strict) + Vite 5 + React 18. Ship a static build whose entry is `index.html` (`main` in the manifest). Install `@pptb/types` as a dev dependency and reference the host globals (`toolboxAPI`, `dataverseAPI`, `powerplatformAPI`).

**Rationale**: PPTB tools are sandboxed web apps; the docs' Quick Start uses Vite and `@pptb/types`. React gives declarative state management for the list/details/selection/grouping UI. Vite produces a small static bundle suited to the iframe.

**Alternatives considered**: Vanilla TS (docs sample) — rejected: grouping forests, multi-select, and per-category modules would require hand-rolled DOM/state that grows error-prone (violates Principle I maintainability). Svelte/Lit — viable and lighter, but React's virtualization ecosystem (`@tanstack/react-virtual`) and team familiarity win.

## Decision 2 — Host API access layer

**Decision**: All host access goes through three thin adapters — `toolboxHost.ts`, `dataverseClient.ts`, `powerPlatformClient.ts`. No component calls `window.*` directly. The adapters expose typed methods and centralize error handling.

**Rationale**: Constitution II mandates host-APIs-only and consistent feedback; a single choke point makes that auditable, keeps `window.*` usage out of UI code, and enables mocking in tests. It also isolates the two data planes (Dataverse via `dataverseAPI`, Power Platform service via `powerplatformAPI`).

**Alternatives considered**: Direct `window.*` calls in components — rejected (untestable, scatters concerns, risks bypassing sandbox conventions).

## Decision 3 — Category extension model

**Decision**: Define a `CategoryModule` contract (see contracts/category-module.md). The shell renders whichever module is active for the selected navigation item. A module supplies: id/label, a data provider (list load with server-side query + paging), list column/row rendering (incl. row styling hook), details-form fields, toolbar actions, grouping options, and filter controls. Modules register in `categories/registry.ts`.

**Rationale**: The spec explicitly separates the shared shell (001) from category specializations (002–004). A contract-driven registry lets each feature be developed, tested, and shipped independently (Principle I; spec's independent-testability goal) without editing shell code.

**Alternatives considered**: Hard-coded per-category branches in the shell — rejected (couples shell to every feature, defeats the spec split, grows unmaintainable).

## Decision 4 — Selection model (CTRL / SHIFT / plain click)

**Decision**: A framework-agnostic `SelectionModel` holds an ordered item set plus an anchor index. Plain click → select one + set anchor. CTRL+click → toggle one, update anchor. SHIFT+click → select inclusive range anchor→target. Selection is de-duplicated by stable item id and reset when the category changes. Group-node selection (002–004) adds/removes a node's item ids through the same model.

**Rationale**: Matches FR-009–012 and the grouping selection needs of 002–004. Keeping it UI-framework-agnostic makes it unit-testable in isolation (Principle I).

**Alternatives considered**: Rely on the browser's native list selection — rejected (inconsistent across custom rows, no range/anchor control, no group-node integration).

## Decision 5 — Server-side data loading, paging, responsiveness

**Decision**: Category data providers query server-side with FetchXML/OData using `$select`/`$filter`/`$top` and follow paging cookies via `dataverseClient`. Loads are async and cancellable (superseded when the user switches category or refreshes). The list is virtualized with `@tanstack/react-virtual`. Search narrows the loaded set client-side over the displayed identifying text; large environments still benefit from server-side `$select` and paging.

**Rationale**: Constitution III forbids fetch-then-filter of whole tables and requires a responsive UI. Virtualization keeps hundreds of rows smooth. Cancellation prevents stale results when navigating quickly.

**Alternatives considered**: Fetch entire tables then filter in memory — rejected (Principle III). Server round-trip per keystroke for search — deferred; client-side narrowing over already-loaded, `$select`-limited data is sufficient for the shell and avoids throttling.

## Decision 6 — Error & empty states

**Decision**: The data hook exposes discrete states: loading, empty (query succeeded, zero rows), error (with a retry that re-runs the load), and ready. Errors also surface a non-blocking notification via `toolboxAPI.utils.showNotification`. Empty and error are visually distinct.

**Rationale**: FR-005 and FR-023 require a distinct, retryable error state and a distinct empty state without blocking the UI.

**Alternatives considered**: Throwing to an error boundary only — rejected (loses the retryable, non-blocking requirement and the empty/error distinction).

## Decision 7 — Theme awareness & feedback

**Decision**: Read the initial theme via `toolboxAPI.utils.getCurrentTheme()`, subscribe to host events for theme/connection updates, and drive styling from CSS variables. Icons use `fill/stroke="currentColor"`. User feedback (success/error/progress) uses `toolboxAPI.utils`.

**Rationale**: Constitution II requires the tool to feel native to PPTB and be theme-aware, and to use host feedback mechanisms.

**Alternatives considered**: Custom toasts/theme — rejected (inconsistent with PPTB; Principle II).

## Decision 8 — Connection lifecycle

**Decision**: Obtain the active connection from `toolboxAPI.connections.getActiveConnection()` (read-only). Re-initialize data when the host emits `connection:updated`. Persist no credentials. Reset category selection/search when the connection changes.

**Rationale**: Constitution II — connection context is host-managed and read-only; the tool must not manage auth or leak state across connection contexts.

**Alternatives considered**: Caching connection/tokens — rejected (prohibited by constitution and Platform Integration Constraints).

## Decision 9 — Manifest & packaging

**Decision**: `package.json` with scoped `name`, `version`, `displayName` "Power Automate Manager", `description`, `main: index.html`, top-level `icon: icons/power-automate-manager.svg`, approved `license`, `contributors`, `configurations.repository`, and `features.minAPI` set to the highest version required by the host methods used (baseline `1.2.0` for `connections.getActiveConnection`). No `configurations.iconURL`.

**Rationale**: Matches the documented manifest contract; `minAPI` prevents runtime errors on older hosts (Principle II).

**Alternatives considered**: Deprecated `configurations.iconURL` — rejected (unsupported). Omitting `minAPI` — rejected because `getActiveConnection()` requires v1.2.0.

## Resolved unknowns

- **UI framework** → React 18 (Decision 1).
- **How categories plug in** → `CategoryModule` registry (Decision 3).
- **Search semantics** → client-side narrowing over `$select`-limited, server-paged data (Decision 5).
- **minAPI value** → `1.2.0` baseline (Decision 9), to be raised if 002–004 adopt higher-versioned methods.

No open `NEEDS CLARIFICATION` items remain for the shell.
