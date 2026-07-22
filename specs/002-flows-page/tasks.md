---
description: "Task list for feature 002 - Flows Page"
---

# Tasks: Flows Page

**Input**: Design documents from `/specs/002-flows-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/. **Depends on feature `001` shell** (CategoryModule contract, host adapters, SelectionModel, grouping forest, batch).

**Tests**: Included (Vitest + RTL, mocked host APIs).

**Organization**: Grouped by user story (US1–US5). Source paths under `PowerAutomateManager.PPTB/src/features/flows/`.

## Phase 1: Setup

- [X] T001 Create `PowerAutomateManager.PPTB/src/features/flows/` and register a placeholder `flowsModule` (id `flows`) in `PowerAutomateManager.PPTB/src/categories/registry.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Implement flow queries in `PowerAutomateManager.PPTB/src/features/flows/flowQueries.ts` (FetchXML for `workflow` category=5/type=1 with `$select`; `solutioncomponent` componenttype 29 → `solution` membership; `connectionreference` index; systemuser and solution picker sources)
- [X] T003 Implement `flowsModule.loadItems` in `PowerAutomateManager.PPTB/src/features/flows/flowsModule.ts` (map `workflow` → ListItem with searchText=name; batch-load solution membership and connection-reference index; index by workflowid)

**Checkpoint**: Flow list data available to all stories.

---

## Phase 3: User Story 1 - Inspect flow details (Priority: P1) 🎯 MVP

**Goal**: Details form shows Name, Owner, State, Solutions, Connection References Used.

**Independent Test**: Select flows and confirm all five detail fields populate; empty fields show explicit empty text.

- [X] T004 [US1] Implement `PowerAutomateManager.PPTB/src/features/flows/flowDetails.ts` (record → DetailField[]: Name, Owner, State, Solutions list, Connection References Used from `clientdata` connectionReferences parse)
- [X] T005 [US1] Wire `getDetails` into `flowsModule` in `PowerAutomateManager.PPTB/src/features/flows/flowsModule.ts`
- [X] T006 [P] [US1] Unit test clientdata parsing + details mapping (incl. empty indications) in `PowerAutomateManager.PPTB/tests/unit/flowDetails.test.ts`

---

## Phase 4: User Story 2 - Perform bulk flow actions (Priority: P1)

**Goal**: Turn On, Turn Off, Change Owner, Add To Solution over the selection with per-flow failure reporting.

**Independent Test**: Apply each action to several flows; managed/unauthorized flows report as failures without aborting the batch.

- [X] T007 [US2] Implement Turn On/Turn Off in `PowerAutomateManager.PPTB/src/features/flows/flowActions.ts` (update statecode/statuscode via `runBatched`; per-flow failures)
- [X] T008 [US2] Implement Change Owner in `PowerAutomateManager.PPTB/src/features/flows/flowActions.ts` (owner reassign via `ownerid@odata.bind` + user picker; no-target → no-op + prompt)
- [X] T009 [US2] Implement Add To Solution in `PowerAutomateManager.PPTB/src/features/flows/flowActions.ts` (`AddSolutionComponent` ComponentType 29 + solution picker; no-target → no-op + prompt)
- [X] T010 [US2] Register `toolbarActions` in `flowsModule` and refresh affected rows after each action in `PowerAutomateManager.PPTB/src/features/flows/flowsModule.ts`
- [X] T011 [P] [US2] Unit test per-flow failure aggregation and partial failure (managed flow) in `PowerAutomateManager.PPTB/tests/unit/flowActions.test.ts`

---

## Phase 5: User Story 3 - Group flows into a selectable forest (Priority: P2)

**Goal**: Group by Solution/State/Owner with multi-level "Then by"; tree/subtree single-action selection; multi-solution duplication with de-dup.

**Independent Test**: Group by Solution then State; select a solution's Off subtree; all Off flows in that solution selected once.

- [X] T012 [US3] Implement `PowerAutomateManager.PPTB/src/features/flows/flowGrouping.ts` (Solution/State/Owner GroupingOption; one key per solution)
- [X] T013 [US3] Wire grouping into the FilterBar slot + forest render + node selection via `SelectionModel.selectIds` (shell `FilterBar`/`GroupedList`/`Shell`)
- [X] T014 [P] [US3] Unit test forest builder (multi-level, multi-solution duplication) + selection de-dup in `PowerAutomateManager.PPTB/tests/unit/flowGrouping.test.ts`

---

## Phase 6: User Story 4 - Filter flows by state and managed status (Priority: P2)

**Goal**: State and managed/unmanaged filters, combinable with search and grouping.

**Independent Test**: Apply State and managed filters; combine with search; clear restores.

- [X] T015 [US4] Implement `PowerAutomateManager.PPTB/src/features/flows/flowFilters.ts` (State + managed FilterControls)
- [X] T016 [US4] Wire filters into the FilterBar and combine with search (AND) (shell `FilterBar`/`useCategoryData`)
- [X] T017 [P] [US4] Unit test filter predicates + combination with search in `PowerAutomateManager.PPTB/tests/unit/flowFilters.test.ts`

---

## Phase 7: User Story 5 - Identify flow state at a glance (Priority: P3)

**Goal**: Rows color-coded by state (green On / red Off) with a non-color badge.

**Independent Test**: On rows show positive accent + "On"; Off rows negative accent + "Off"; readable in both themes.

- [X] T018 [US5] Implement `PowerAutomateManager.PPTB/src/features/flows/flowRowStyle.ts` (statecode → RowStyle accent + badge)
- [X] T019 [US5] Wire `getRowStyle` into `flowsModule` in `PowerAutomateManager.PPTB/src/features/flows/flowsModule.ts`
- [X] T020 [P] [US5] Unit test row style On/Off + badge in `PowerAutomateManager.PPTB/tests/unit/flowFilters.test.ts`

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T021 [P] Verify `features.minAPI` still correct; run `npm run lint` and `npm run typecheck` to zero errors
- [ ] T022 Run flows quickstart.md scenarios 1–8 against a real environment
- [ ] T023 [P] Performance pass with hundreds of flows (grouping/selection/bulk batching without UI freeze)

---

## Dependencies & Execution Order

- Requires feature `001` shell complete.
- **Setup (T001)** → **Foundational (T002–T003)** blocks all stories.
- **US1 (T004–T006)** MVP; **US2 (T007–T011)** is the core value; **US3 (T012–T014)**, **US4 (T015–T017)**, **US5 (T018–T020)** parallelizable after foundation.
- **Polish (T021–T023)** last.

### Parallel opportunities

- Test tasks T006, T011, T014, T017, T020 run in parallel.

## Implementation Strategy

- **MVP** = Setup + Foundational + US1 (flow details).
- Then US2 (bulk actions) for core management value, followed by US3/US4/US5.
