# Research: Non-Blocking Loading, Caching, and Per-Object Reload

**Feature**: 006-loading-caching | **Date**: 2026-07-24 | **Phase**: 0

## Decision 1 — In-memory per-connection category cache

**Decision**: Add `src/state/categoryCache.ts` — a module-scoped `Map<string, ListItem[]>` keyed `${connectionId}:${categoryId}` with `get`, `set`, `invalidate(connectionId, categoryId)`, and `clear()`. `useCategoryData` checks the cache on category/connection change: on a hit it sets `ready(cached)` immediately with no load; on a miss it loads, then caches. `refresh()` invalidates the current key and reloads. A connection change calls `clear()`.

**Rationale**: Satisfies FR-003/FR-004/FR-005 with the smallest change; keying by connection prevents cross-connection leakage (Constitution II). Module-scope persists across category switches while the shell stays mounted.

**Alternatives considered**: React state/ref in the shell — works but a standalone store is easier to unit-test and reason about. Time-based expiry — rejected per spec (freshness via Refresh/connection change only).

## Decision 2 — Non-blocking loads (spinner, not a blocking state)

**Decision**: Keep the existing `loading` state but render a visible `Spinner` component in the list area instead of text. Because loading only replaces the (empty) list area and navigation lives outside it, switching categories during a load is already non-blocking; cancellation via `AbortSignal` (already implemented) supersedes stale loads.

**Rationale**: FR-001/FR-002. Awaiting a promise does not block the JS main thread, so the UI stays interactive; the fix is visual (spinner) plus not replacing populated lists during operations (Decision 3).

**Alternatives considered**: A global overlay spinner — rejected (would block interaction, violating FR-002).

## Decision 3 — Non-blocking operations with per-object busy state

**Decision**: The shell tracks `busyIds: Set<string>`. `handleRunAction` (a) filters the selection to non-busy objects (concurrency guard, FR-009), (b) marks them busy, (c) runs `action.run` without gating the UI, (d) on completion notifies, reloads only those objects (Decision 4), and clears their busy flag. The list no longer transitions to a global loading state during operations, so rows stay visible and selectable (FR-007). `ObjectList`/`GroupedList` render a per-row `Spinner` for ids in `busyIds` (FR-006).

**Rationale**: Directly implements the sample (Turn On one flow → spinner on it, select the next immediately). Per-object busy + guard prevents double operations on the same object.

**Alternatives considered**: Disabling the whole toolbar during operations — rejected (blocks the user, the exact problem). A global "operation in progress" flag — rejected (not per-object).

## Decision 4 — Per-object reload via optional `CategoryModule.reloadItem`

**Decision**: Add optional `reloadItem(id, ctx): Promise<ListItem | null>` to `CategoryModule`. After an operation, the shell calls it for each affected id, then applies the result via `useCategoryData.applyItemUpdates([{ id, item }])` (item `null` removes a deleted object). `applyItemUpdates` updates both the hook's items and the cache. If a module has no `reloadItem`, the affected objects' busy flags simply clear (no row change). Flows and Connection References implement it (single-record `retrieve`); Connections omits it (Share doesn't change the visible row).

**Rationale**: FR-008/FR-011/FR-013. A single-record `retrieve` is the server-side, minimal refetch (Constitution III), avoiding whole-list reloads and preserving scroll/selection (SC-003).

**Alternatives considered**: Re-running `loadItems` and diffing — rejected (full refetch defeats the purpose). Optimistic local mutation without refetch — rejected (would drift from server truth for state/owner).

## Decision 5 — Applying item updates to state and cache

**Decision**: `useCategoryData` exposes `applyItemUpdates(updates: { id: string; item: ListItem | null }[])`, which replaces/removes items by id in the ready state and writes the same change through to the cache entry, keeping cache and view consistent.

**Rationale**: Keeps the cache authoritative and consistent after per-object reloads (SC-005) without a full reload.

**Alternatives considered**: Invalidate the whole cache after each operation — rejected (would force a reload on next visit, negating caching).

## Resolved unknowns

- **Cache scope/keying** → in-memory, `${connectionId}:${categoryId}` (Decision 1).
- **Spinner blocking** → visual spinner; no global blocking overlay (Decision 2).
- **Per-object refresh mechanism** → optional `reloadItem` + `applyItemUpdates` (Decisions 4–5).
- **Concurrency** → per-object busy guard in the shell (Decision 3).

No open `NEEDS CLARIFICATION` items remain.
