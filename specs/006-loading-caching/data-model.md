# Data Model: Non-Blocking Loading, Caching, and Per-Object Reload

**Feature**: 006-loading-caching | **Date**: 2026-07-24 | **Phase**: 1

Additive changes; no domain schema changes.

## New/changed types

### Category cache entry (`state/categoryCache.ts`)
- Key: `${connectionId}:${categoryId}` (string).
- Value: `ListItem[]` — the last loaded objects for that category under that connection.
- Operations: `get(connectionId, categoryId)`, `set(connectionId, categoryId, items)`, `invalidate(connectionId, categoryId)`, `clear()`.

### `CategoryModule` (shell `models/types.ts`)
- **Add** optional `reloadItem?(id: string, ctx: LoadContext): Promise<ListItem | null>` — returns the object's fresh row, or `null` if it no longer exists.

### `useCategoryData` result
- Existing: `{ state, visibleItems, refresh }`.
- **Add** `applyItemUpdates(updates: { id: string; item: ListItem | null }[]): void` — replace (or remove when `item` is `null`) items by id in both the ready state and the cache.

### Shell state
- **Add** `busyIds: Set<string>` — objects with an in-progress operation or per-object refresh.

## Rules

- **Cache hit**: on category/connection change, if `get` returns items → set `ready(items)` immediately, no load, no spinner (FR-003, SC-001).
- **Cache miss/refresh**: load via `loadItems`; on success `set` the cache and show `ready`. `refresh()` calls `invalidate` first (FR-004).
- **Connection change**: `clear()` the whole cache and reset view (FR-005).
- **Operation flow**: target = selected − busy (guard, FR-009); mark busy; run `action.run`; notify; for each target id call `reloadItem` (if present) and `applyItemUpdates`; clear busy (FR-006–FR-008, FR-010).
- **Per-object refresh failure**: record the failure for that id; leave the rest of the list intact (FR-011).
- **Busy indicator**: rows whose id ∈ `busyIds` render a spinner (FR-006, FR-012).
- **No `reloadItem`**: busy clears with no row change (allowed, FR-013; e.g., Connections/Share).

## Entities (conceptual)

- **Category cache** — session/in-memory, per connection+category.
- **Operation (in-progress)** — affected ids held in `busyIds` until completion.
- **Busy indicator** — per-row spinner driven by `busyIds`.
