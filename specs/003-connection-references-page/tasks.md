---
description: "Task list for feature 003 - Connection References Page"
---

# Tasks: Connection References Page

**Input**: Design documents from `/specs/003-connection-references-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/. **Depends on feature `001` shell**; reuses the grouping forest and the `workflow.clientdata` flow index from feature `002`.

**Tests**: Included (Vitest + RTL, mocked host APIs).

**Organization**: Grouped by user story (US1–US5). Source paths under `PowerAutomateManager.PPTB/src/features/connection-references/`.

## Phase 1: Setup

- [ ] T001 Create `PowerAutomateManager.PPTB/src/features/connection-references/` and register a placeholder `connectionReferencesModule` (id `connection-references`) in `PowerAutomateManager.PPTB/src/categories/registry.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T002 Implement queries in `PowerAutomateManager.PPTB/src/features/connection-references/connRefQueries.ts` (`connectionreference` with `$select`; `solutioncomponent` membership [connection-reference componenttype verified from metadata] → `solution`; reuse flows-using index; connections list for pickers)
- [ ] T003 Implement `connectionReferencesModule.loadItems` in `PowerAutomateManager.PPTB/src/features/connection-references/connectionReferencesModule.ts` (map `connectionreference` → ListItem, searchText=display name, secondary=connector; batch-load solution membership + flows-using index)

**Checkpoint**: Reference list data available to all stories.

---

## Phase 3: User Story 1 - Inspect connection reference details (Priority: P1) 🎯 MVP

**Goal**: Details form shows Name, Connection, Solutions, Flows Using It.

**Independent Test**: Select references and confirm all four detail fields populate; empty fields show explicit empty text.

- [ ] T004 [US1] Implement `PowerAutomateManager.PPTB/src/features/connection-references/connRefDetails.ts` (record → DetailField[]: Name, Connection, Solutions list, Flows Using It list)
- [ ] T005 [US1] Wire `getDetails` into `connectionReferencesModule` in `PowerAutomateManager.PPTB/src/features/connection-references/connectionReferencesModule.ts`
- [ ] T006 [P] [US1] Unit test details mapping incl. empty indications in `PowerAutomateManager.PPTB/tests/unit/connRefDetails.test.ts`

---

## Phase 4: User Story 2 - Merge connection references (Priority: P1)

**Goal**: Merge requires a master connection and is permitted only when all selected references share one connector; consolidate `connectionid` onto the master.

**Independent Test**: Merge same-connector references onto a master connection; Merge is blocked for mixed connectors.

- [ ] T007 [US2] Implement the same-connector gate in `PowerAutomateManager.PPTB/src/features/connection-references/connRefActions.ts` (`distinctConnectors(selection).length === 1`; blocked message otherwise)
- [ ] T008 [US2] Implement Merge run in `PowerAutomateManager.PPTB/src/features/connection-references/connRefActions.ts` (master-connection picker filtered to the shared connector; update `connectionid` for all selected via `runBatched`; per-reference failures; no-target → no-op + prompt)
- [ ] T009 [P] [US2] Unit test the same-connector gate, blocked-message path, and per-reference failure aggregation in `PowerAutomateManager.PPTB/tests/unit/connRefMerge.test.ts`

---

## Phase 5: User Story 3 - Change connection and add to solution (Priority: P1)

**Goal**: Change Connection (connector-filtered) and Add To Solution over the selection.

**Independent Test**: Repoint references to a target connection; add references to a solution; both report per-reference results.

- [ ] T010 [US3] Implement Change Connection in `PowerAutomateManager.PPTB/src/features/connection-references/connRefActions.ts` (connector-filtered connection picker; update `connectionid` batched; no-target → no-op + prompt)
- [ ] T011 [US3] Implement Add To Solution in `PowerAutomateManager.PPTB/src/features/connection-references/connRefActions.ts` (`AddSolutionComponent` with connection-reference componenttype + solution picker; no-target → no-op + prompt)
- [ ] T012 [US3] Register `toolbarActions` (Change Connection, Add To Solution, Merge) in `connectionReferencesModule` and refresh affected rows in `PowerAutomateManager.PPTB/src/features/connection-references/connectionReferencesModule.ts`
- [ ] T013 [P] [US3] Unit test Change Connection picker filtering + per-reference failures in `PowerAutomateManager.PPTB/tests/unit/connRefActions.test.ts`

---

## Phase 6: User Story 4 - Group into a selectable forest (Priority: P2)

**Goal**: Group by Solution or Connector with "Then by"; tree/subtree selection; multi-solution duplication + de-dup.

**Independent Test**: Group by Connector then Solution; select a connector subtree; all references using that connector selected once.

- [ ] T014 [US4] Implement `PowerAutomateManager.PPTB/src/features/connection-references/connRefGrouping.ts` (Solution/Connector GroupingOption; one key per solution)
- [ ] T015 [US4] Wire grouping into the FilterBar slot + forest render + node selection via `SelectionModel.selectIds`
- [ ] T016 [P] [US4] Unit test forest builder + selection de-dup in `PowerAutomateManager.PPTB/tests/unit/connRefGrouping.test.ts`

---

## Phase 7: User Story 5 - Filter by managed status (Priority: P2)

**Goal**: Managed/unmanaged filter (no State filter), combinable with search.

**Independent Test**: Apply managed filter; combine with search; clear restores.

- [ ] T017 [US5] Implement `PowerAutomateManager.PPTB/src/features/connection-references/connRefFilters.ts` (managed FilterControl only)
- [ ] T018 [US5] Wire the managed filter into the FilterBar and combine with search (AND)
- [ ] T019 [P] [US5] Unit test managed predicate + combination with search in `PowerAutomateManager.PPTB/tests/unit/connRefFilters.test.ts`

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T020 Verify the connection-reference `solutioncomponent.componenttype` value from environment metadata and update `connRefQueries.ts`/`connRefActions.ts`
- [ ] T021 [P] Run `npm run lint` and `npm run typecheck` to zero errors
- [ ] T022 Run connection-references quickstart.md scenarios 1–8 against a real environment
- [ ] T023 [P] Performance pass with hundreds of references

---

## Dependencies & Execution Order

- Requires feature `001` shell; reuses `002` forest + flow index.
- **Setup (T001)** → **Foundational (T002–T003)** blocks all stories.
- **US1 (T004–T006)** MVP; **US2 (T007–T009)** and **US3 (T010–T013)** are the P1 core; **US4 (T014–T016)**, **US5 (T017–T019)** after foundation.
- **Polish (T020–T023)** last (T020 verification should precede release).

### Parallel opportunities

- Test tasks T006, T009, T013, T016, T019 run in parallel.

## Implementation Strategy

- **MVP** = Setup + Foundational + US1 (reference details).
- Then US2 (Merge) and US3 (Change Connection / Add To Solution), followed by US4/US5.
