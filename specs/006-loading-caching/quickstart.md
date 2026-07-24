# Quickstart: Non-Blocking Loading, Caching, and Per-Object Reload

**Feature**: 006-loading-caching | **Phase**: 1

Validates the loading/caching/per-object-reload improvements. Prerequisites as in the [001 quickstart](../001-power-automate-manager/quickstart.md), with an environment where lists take a noticeable moment to load and operations (e.g., Turn On) take a few seconds.

## Build & load

```powershell
cd PowerAutomateManager.PPTB
npm run build
```

Reload the tool in PPTB.

## Validation scenarios

Mapped to [spec.md](spec.md).

1. **Loading spinner (US1, FR-001/FR-002)**: Open Flows on a large environment → a visible spinner shows while loading; the navigation bar stays responsive (switch to another category mid-load).
2. **Cache hit (US3, FR-003/SC-001)**: Load Flows, switch to Connections, switch back to Flows → the Flows list appears immediately with no spinner and no reload.
3. **Refresh forces reload (FR-004)**: On a cached category, click Refresh → a fresh load occurs (spinner shows).
4. **Connection change clears cache (FR-005)**: Switch the active connection → categories reload on next view.
5. **Non-blocking operation (US2, FR-006/FR-007/SC-002)**: Select one flow and Turn On (a multi-second op) → a spinner appears on that flow; immediately select and inspect a different flow with no delay.
6. **Concurrency guard (FR-009)**: While a flow's operation is in progress, attempt another operation on the same flow → it is not started again until the first completes.
7. **Per-object reload (US4, FR-008/SC-003)**: Turn Off a flow → only that row updates (state/color); other rows and the scroll position are undisturbed and not reloaded.
8. **Per-object failure (FR-011)**: Force a per-object refresh failure → the affected object's failure is surfaced while the rest of the list remains intact.
9. **Bulk busy (edge case)**: Select several flows via a group node and Turn On → each affected row shows its own spinner; only those rows reload on completion.

## Automated checks

```powershell
npm run lint
npm run typecheck
npm test -- categoryCache useCategoryData shell
```

Expected: unit tests cover the cache store (get/set/invalidate/clear + connection keying), `applyItemUpdates` (state + cache consistency, removal on `null`), the busy-guard/non-blocking action flow, and a component test that a cache hit renders without a loading state.

## Done when

- Scenarios 1–9 pass against a real environment.
- Returning to a loaded category never shows a spinner; operations never freeze the UI; only affected rows reload.
