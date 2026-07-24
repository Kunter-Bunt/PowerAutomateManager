# Contract: Loading, Cache & Per-Object Reload

**Feature**: 006-loading-caching | **Phase**: 1

## Cache store — `src/state/categoryCache.ts`

```ts
export function getCached(connectionId: string, categoryId: CategoryId): ListItem[] | undefined;
export function setCached(connectionId: string, categoryId: CategoryId, items: ListItem[]): void;
export function invalidateCached(connectionId: string, categoryId: CategoryId): void;
export function clearCache(): void;
```

Rules: keyed `${connectionId}:${categoryId}`; in-memory only; `clearCache()` on connection change.

## `CategoryModule` addition — `models/types.ts`

```ts
reloadItem?(id: string, ctx: LoadContext): Promise<ListItem | null>;
```

Rules: returns the fresh row for `id`, or `null` if the object no longer exists (remove it). Uses a server-side single-record read; MUST honor `ctx.signal` where applicable. Optional — omit when an operation cannot change the visible row.

## `useCategoryData` — `state/useCategoryData.ts`

```ts
interface CategoryData {
  state: LoadState;
  visibleItems: ListItem[];
  refresh: () => void;                                   // invalidate cache + reload
  applyItemUpdates(updates: { id: string; item: ListItem | null }[]): void;
}
```

Rules:
- Cache hit → `ready(cached)` with no load/spinner.
- Miss → load, then `setCached`.
- `applyItemUpdates` replaces/removes items by id in state AND cache (keeps them consistent).

## Shell non-blocking action flow (behavioral contract)

```text
runAction(action):
  target = selectedItems.filter(i => !busyIds.has(i.id))   // concurrency guard
  if target empty: return
  setBusy(add target ids)
  result = await action.run(target, ctx)                    // UI stays interactive
  notify(result)                                            // per-object outcome, non-blocking
  updates = await Promise.all(target.map(reloadOne))        // per-object reload
  applyItemUpdates(updates)
  setBusy(remove target ids)
```

Rules: never transitions the whole list to a global loading state during an operation; rows remain visible/selectable; each affected row shows a spinner until its busy flag clears.

## List rendering

- `ObjectList` and `GroupedList` accept `busyIds: Set<string>` and render a `Spinner` on rows whose id is busy (theme-aware).
