---
description: "Task list for feature 001 - Power Automate Manager (tool shell)"
---

# Tasks: Power Automate Manager (Tool Shell)

**Input**: Design documents from `/specs/001-power-automate-manager/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — the plan specifies a Vitest + RTL strategy and the constitution requires automated tests before merge.

**Organization**: Grouped by user story (US1–US5). All source paths are under `PowerAutomateManager.PPTB/`.

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Scaffold the PPTB tool project: create `PowerAutomateManager.PPTB/package.json` (manifest per contracts/manifest.md — top-level `icon`, `main: index.html`, `features.minAPI: 1.2.0`, `@pptb/types`), `PowerAutomateManager.PPTB/index.html` (with `#app`), `PowerAutomateManager.PPTB/vite.config.ts`, `PowerAutomateManager.PPTB/tsconfig.json` (strict)
- [X] T002 Install dependencies in `PowerAutomateManager.PPTB/`: `react`, `react-dom`, `@tanstack/react-virtual`; dev: `@pptb/types`, `typescript`, `vite`, `vitest`, `@testing-library/react`, `jsdom`
- [X] T003 [P] Configure ESLint + Prettier (zero-error gates) in `PowerAutomateManager.PPTB/.eslintrc.cjs` and `PowerAutomateManager.PPTB/.prettierrc`
- [X] T004 [P] Add theme-aware icon `PowerAutomateManager.PPTB/public/icons/power-automate-manager.svg` (`fill`/`stroke="currentColor"`)
- [X] T005 [P] Configure Vitest and a typed host-API test double in `PowerAutomateManager.PPTB/tests/setup.ts` (mocks for `window.toolboxAPI`/`dataverseAPI`/`powerplatformAPI`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 Define shared types in `PowerAutomateManager.PPTB/src/models/types.ts` (CategoryId, ListItem, RowStyle, DetailField, ToolbarAction, ActionResult, Selection, LoadState, GroupNode, GroupingOption, GroupKey, FilterControl, LoadContext) per data-model.md and contracts/category-module.md
- [X] T007 [P] Implement toolbox host adapter in `PowerAutomateManager.PPTB/src/services/toolboxHost.ts` (getActiveConnection, onHostEvent, notify, copy, getTheme, parallel, settings)
- [X] T008 [P] Implement Dataverse client adapter in `PowerAutomateManager.PPTB/src/services/dataverseClient.ts` (fetchAll with paging cookie + AbortSignal, query, retrieve, update, updateMany, execute, getSolutions) per contracts/host-adapters.md
- [X] T009 [P] Implement Power Platform client adapter in `PowerAutomateManager.PPTB/src/services/powerPlatformClient.ts` (namespaced get/post)
- [X] T010 [P] Implement `runBatched` in `PowerAutomateManager.PPTB/src/lib/batch.ts` (bounded concurrency + retry/backoff on HTTP 429; returns per-item failures, never rejects on partial failure)
- [X] T011 [P] Implement theme helpers in `PowerAutomateManager.PPTB/src/lib/theme.ts` (CSS variables, accent resolution for RowStyle)
- [X] T012 [P] Implement the multi-level grouping forest builder in `PowerAutomateManager.PPTB/src/lib/grouping.ts` (1–3 levels; group nodes carry descendant itemIds)
- [X] T013 Implement `SelectionModel` in `PowerAutomateManager.PPTB/src/state/SelectionModel.ts` (selectOne/toggle/selectRange/selectIds/clear/selectAllVisible; de-dup by id; anchor index)
- [X] T014 Implement the category registry in `PowerAutomateManager.PPTB/src/categories/registry.ts` (registerCategory, getCategories)
- [X] T015 Implement app bootstrap `PowerAutomateManager.PPTB/src/main.tsx` (mount into `#app`, read theme) and shell layout `PowerAutomateManager.PPTB/src/app/Shell.tsx` (navigation + toolbar + filter/group/sort bar + list + details regions)
- [X] T016 Implement connection lifecycle in `PowerAutomateManager.PPTB/src/app/Shell.tsx` (getActiveConnection; subscribe to `connection:updated` → re-init; reset selection/search on connection change)

**Checkpoint**: Foundation ready — user stories can begin.

---

## Phase 3: User Story 1 - Browse objects by category (Priority: P1) 🎯 MVP

**Goal**: Left navigation switches between Flows / Connection References / Connections and loads the corresponding list.

**Independent Test**: Click each navigation item; the main area shows the correct category with identifying text per row; an empty category shows an empty-state.

- [X] T017 [P] [US1] Implement `NavigationBar` in `PowerAutomateManager.PPTB/src/app/NavigationBar.tsx` (Flows, Connection References, Connections)
- [X] T018 [US1] Implement `useCategoryData` hook in `PowerAutomateManager.PPTB/src/state/useCategoryData.ts` (call active module `loadItems` with AbortSignal; states loading/ready/empty/error+retry; cancel on category switch)
- [X] T019 [US1] Implement virtualized `ObjectList` in `PowerAutomateManager.PPTB/src/app/ObjectList.tsx` using `@tanstack/react-virtual` (render primary/secondary text and RowStyle accent+badge)
- [X] T020 [US1] Wire category switching in `PowerAutomateManager.PPTB/src/app/Shell.tsx` (activate module from registry; empty-state placeholder when a category has no registered module)
- [X] T021 [P] [US1] Unit test load/empty/error transitions in `PowerAutomateManager.PPTB/tests/unit/useCategoryData.test.ts`
- [X] T022 [P] [US1] Component test navigation + list render/switch in `PowerAutomateManager.PPTB/tests/component/list.test.tsx`

**Checkpoint**: Browsing by category works end-to-end (MVP).

---

## Phase 4: User Story 2 - Inspect object details (Priority: P1)

**Goal**: Selecting one object shows a details form; changing selection updates it; clearing shows a neutral empty state.

**Independent Test**: Select one object per category and confirm the right panel populates and updates.

- [X] T023 [US2] Implement `DetailsPanel` in `PowerAutomateManager.PPTB/src/app/DetailsPanel.tsx` (render DetailField[] from active module `getDetails`; neutral empty state; multi-select message)
- [X] T024 [US2] Wire single-selection → details in `PowerAutomateManager.PPTB/src/app/Shell.tsx` (load details on single selection; clear → empty)
- [X] T025 [P] [US2] Component test details states (none/one/multiple) in `PowerAutomateManager.PPTB/tests/component/details.test.tsx`

**Checkpoint**: US1 + US2 both work independently.

---

## Phase 5: User Story 3 - Select multiple objects (Priority: P2)

**Goal**: CTRL/SHIFT/plain-click multi-select in every list; selection resets on category change.

**Independent Test**: CTRL toggles individual rows; SHIFT selects a range; plain click collapses; switching category clears.

- [X] T026 [US3] Integrate `SelectionModel` gestures in `PowerAutomateManager.PPTB/src/app/ObjectList.tsx` (plain/CTRL/SHIFT click; anchor handling)
- [X] T027 [US3] Reset selection on category and connection change in `PowerAutomateManager.PPTB/src/app/Shell.tsx`
- [X] T028 [P] [US3] Unit test gestures + de-dup + reset in `PowerAutomateManager.PPTB/tests/unit/selection.test.ts`

**Checkpoint**: Multi-select works across all lists.

---

## Phase 6: User Story 4 - Toolbar actions (Priority: P2)

**Goal**: Common Refresh / Select All / Clear Selection available for every category.

**Independent Test**: Refresh reloads; Select All selects all visible; Clear empties; actions persist across categories.

- [X] T029 [US4] Implement `Toolbar` in `PowerAutomateManager.PPTB/src/app/Toolbar.tsx` (common Refresh/Select All/Clear + slot for category actions)
- [X] T030 [US4] Wire Refresh (reload current category), Select All (visible only), Clear in `PowerAutomateManager.PPTB/src/app/Shell.tsx`
- [X] T031 [P] [US4] Component test toolbar actions in `PowerAutomateManager.PPTB/tests/component/toolbar.test.tsx`

**Checkpoint**: Toolbar operates on every category.

---

## Phase 7: User Story 5 - Search within a list (Priority: P3)

**Goal**: A search box narrows the current list; Select All respects visible results; search resets on category change.

**Independent Test**: Type to narrow; clear to restore; non-matching term shows empty-state; switching category resets.

- [X] T032 [US5] Implement `FilterBar` in `PowerAutomateManager.PPTB/src/app/FilterBar.tsx` (search box + slot for category filters/grouping)
- [X] T033 [US5] Implement search narrowing over loaded items in `PowerAutomateManager.PPTB/src/state/useCategoryData.ts` (searchText contains; empty-state on no match; Select All uses visible set)
- [X] T034 [US5] Reset search on category change in `PowerAutomateManager.PPTB/src/app/Shell.tsx`
- [X] T035 [P] [US5] Component test search narrowing + reset in `PowerAutomateManager.PPTB/tests/component/search.test.tsx`

**Checkpoint**: All five shell stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T036 [P] Ensure error/empty states are consistent and non-blocking via `toolboxHost.notify` across all categories
- [ ] T037 Validate responsiveness with hundreds of items (virtualization) and cancellation on rapid category switching
- [X] T038 [P] Run `npm run lint` and `npm run typecheck`; fix to zero errors
- [ ] T039 Run quickstart.md scenarios 1–7 against a real environment
- [X] T040 [P] Add tool usage notes in `PowerAutomateManager.PPTB/README.md`

---

## Dependencies & Execution Order

- **Setup (T001–T005)** → **Foundational (T006–T016)** blocks all stories.
- **US1 (T017–T022)** is the MVP; **US2 (T023–T025)** depends only on foundation.
- **US3 (T026–T028)**, **US4 (T029–T031)**, **US5 (T032–T035)** each depend on foundation and US1's list; can proceed in parallel after US1.
- **Polish (T036–T040)** last.

### Parallel opportunities

- Setup: T003, T004, T005 in parallel.
- Foundational: T007–T012 in parallel (distinct files) before T013–T016.
- Tests within each story (T021/T022, T025, T028, T031, T035) run in parallel.

## Implementation Strategy

- **MVP** = Phase 1 + Phase 2 + US1 (browse by category). Delivers a usable, connected list.
- Increment: add US2 (details), then US3/US4/US5.
- Category modules (Flows/Connection References/Connections) ship in features 002–004 and register into this shell.
