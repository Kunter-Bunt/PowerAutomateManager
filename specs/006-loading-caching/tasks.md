---
description: "Task list for feature 006 - Non-Blocking Loading, Caching, and Per-Object Reload"
---

# Tasks: Non-Blocking Loading, Caching, and Per-Object Reload

**Input**: Design documents from `/specs/006-loading-caching/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/. **Refines the shell (`001`) load + action flow; affects Flows/Connection References/Connections.**

**Tests**: Included (Vitest + RTL, mocked host APIs).

**Organization**: Grouped by user story. Source paths under `PowerAutomateManager.PPTB/`.

## Phase 1: Setup

- [X] T001 [P] Add a theme-aware `Spinner` component `PowerAutomateManager.PPTB/src/app/Spinner.tsx` and spinner/busy-row styles in `PowerAutomateManager.PPTB/src/styles.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 [P] Create the cache store `PowerAutomateManager.PPTB/src/state/categoryCache.ts` (`getCached`/`setCached`/`invalidateCached`/`clearCache`, keyed `${connectionId}:${categoryId}`)
- [X] T003 Add optional `reloadItem?(id, ctx): Promise<ListItem | null>` to `CategoryModule` in `PowerAutomateManager.PPTB/src/models/types.ts`
- [X] T004 Make `useCategoryData` cache-aware in `PowerAutomateManager.PPTB/src/state/useCategoryData.ts` (serve cache hits without loading; `setCached` on load; `refresh` invalidates; expose `applyItemUpdates(updates)` updating state + cache) (depends on T002)

**Checkpoint**: Cache and per-object update plumbing available.

---

## Phase 3: User Story 1 - Non-blocking spinner while a list loads (Priority: P1) 🎯 MVP

**Goal**: A visible spinner shows during load without blocking navigation.

**Independent Test**: Open a large category → spinner shows; navigation stays responsive; spinner clears when data arrives.

- [X] T005 [US1] Render the `Spinner` in the list-area loading state in `PowerAutomateManager.PPTB/src/app/Shell.tsx` (`ListRegion` loading branch)
- [X] T006 [P] [US1] Component test that the loading state shows the spinner and navigation remains clickable in `PowerAutomateManager.PPTB/tests/component/cache.test.tsx`

---

## Phase 4: User Story 3 - Cache categories so switching back is instant (Priority: P2)

**Goal**: Returning to a loaded category shows it instantly; Refresh/connection-change get fresh data.

**Independent Test**: Load Flows → Connections → Flows; the second Flows view is immediate with no loading state.

- [X] T007 [US3] Clear the cache on connection change in `PowerAutomateManager.PPTB/src/app/Shell.tsx` (call `clearCache()` in the connection-change effect)
- [X] T008 [P] [US3] Unit test the cache store (get/set/invalidate/clear + connection keying) in `PowerAutomateManager.PPTB/tests/unit/categoryCache.test.ts`
- [X] T009 [P] [US3] Component test that switching away and back to a loaded category renders immediately without a loading spinner in `PowerAutomateManager.PPTB/tests/component/cache.test.tsx`

---

## Phase 5: User Story 2 - Non-blocking object operations with a per-object spinner (Priority: P1)

**Goal**: Operations show a per-object spinner, keep the UI interactive, and guard against concurrent ops on the same object.

**Independent Test**: Turn On one flow (multi-second) → spinner on it; select another flow immediately; the same flow rejects a second concurrent op.

- [X] T010 [US2] Add `busyIds` state and rework `handleRunAction` in `PowerAutomateManager.PPTB/src/app/Shell.tsx` (filter out busy from target; mark busy; run non-blocking; notify; per-object reload; clear busy)
- [X] T011 [US2] Pass `busyIds` to lists and render a per-row `Spinner` in `PowerAutomateManager.PPTB/src/app/ObjectList.tsx` and `PowerAutomateManager.PPTB/src/app/GroupedList.tsx`
- [X] T012 [P] [US2] Unit/component test the non-blocking action flow + concurrency guard (busy id excluded from a second run) in `PowerAutomateManager.PPTB/tests/component/operations.test.tsx`

---

## Phase 6: User Story 4 - Reload only the affected object after an operation (Priority: P2)

**Goal**: Only affected objects re-fetch after an operation; the rest of the list is untouched.

**Independent Test**: Turn Off a flow → only its row updates; other rows/scroll unchanged.

- [X] T013 [P] [US4] Implement `reloadItem` in `PowerAutomateManager.PPTB/src/features/flows/flowsModule.ts` (retrieve `workflow` row → ListItem, or `null` if gone)
- [X] T014 [P] [US4] Implement `reloadItem` in `PowerAutomateManager.PPTB/src/features/connection-references/connectionReferencesModule.ts` (retrieve `connectionreference` row → ListItem)
- [X] T015 [US4] Wire per-object reload in `handleRunAction` via `applyItemUpdates` (from T010); when a module has no `reloadItem`, just clear busy (Connections)
- [X] T016 [P] [US4] Unit/component test per-object reload applies only to affected rows in `PowerAutomateManager.PPTB/tests/component/operations.test.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T017 Run `npm run typecheck`, `npm run lint`, and `npm test` to zero errors/failures
- [ ] T018 Run quickstart.md scenarios 1–9 against a real environment

---

## Dependencies & Execution Order

- **Setup (T001)** and **Foundational (T002–T004)** block the stories; T004 depends on T002.
- **US1 (T005–T006)** MVP; **US3 (T007–T009)** builds on the cache (T002/T004).
- **US2 (T010–T012)** introduces busy-state + non-blocking flow; **US4 (T013–T016)** completes the flow with per-object reload (T015 depends on T010).
- **Polish (T017–T018)** last; T018 requires a live environment.

### Parallel opportunities

- T001/T002 in parallel; T006/T008/T009 in parallel; T013/T014/T016 in parallel.

## Implementation Strategy

- **MVP** = Setup + Foundational + US1 (visible non-blocking spinner) + US3 (cache).
- Then US2 (non-blocking operations + busy spinner) and US4 (per-object reload).
