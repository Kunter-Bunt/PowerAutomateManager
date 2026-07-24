---
description: "Task list for feature 005 - Exclude Default Solution from Groupings and Listings"
---

# Tasks: Exclude Default Solution from Groupings and Listings

**Input**: Design documents from `/specs/005-exclude-default-solution/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/. **Refines features `002` (flows) and `003` (connection references); depends on shell `001`.**

**Tests**: Included (Vitest, mocked host APIs).

**Organization**: Grouped by user story (US1 exclusion, US2 "None" ordering). Source paths under `PowerAutomateManager.PPTB/`.

## Phase 1: Setup

- [X] T001 [P] Create the shared helper `PowerAutomateManager.PPTB/src/lib/solutions.ts` (`DEFAULT_SOLUTION_UNIQUE_NAME = 'Default'`, `isDefaultSolution(uniqueName)`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ Blocks both user stories.**

- [X] T002 Add optional `sortLast?: boolean` to `GroupKey` and `GroupNode` in `PowerAutomateManager.PPTB/src/models/types.ts`
- [X] T003 Update `buildForest` in `PowerAutomateManager.PPTB/src/lib/grouping.ts` to carry `sortLast` from each `GroupKey` onto its node and sort each level by `sortLast` (false first) then `label.localeCompare` (depends on T002)

**Checkpoint**: Shell supports Default-solution matching and last-ordering of group keys.

---

## Phase 3: User Story 1 - Hide the Default solution everywhere solutions are shown (Priority: P1) 🎯 MVP

**Goal**: The Default solution (unique name `Default`) never appears in Solution groupings or the details "Solutions" list, for Flows and Connection References. Objects are never removed.

**Independent Test**: Group by Solution → no Default group; open an object in Default + one other solution → details show only the other solution.

- [X] T004 [P] [US1] Add `uniqueName: string` to `SolutionRef` in `PowerAutomateManager.PPTB/src/features/flows/flowState.ts`
- [X] T005 [P] [US1] Add `uniqueName: string` to `SolutionRef` in `PowerAutomateManager.PPTB/src/features/connection-references/connRefState.ts`
- [X] T006 [US1] In `PowerAutomateManager.PPTB/src/features/flows/flowQueries.ts` `loadSolutionMembership`, capture `sol.uniquename` and skip rows where `isDefaultSolution(uniquename)` (depends on T001, T004)
- [X] T007 [US1] In `PowerAutomateManager.PPTB/src/features/connection-references/connRefQueries.ts` `buildSolutionsByRef`, capture `sol.uniquename` and skip rows where `isDefaultSolution(uniquename)` (depends on T001, T005)
- [X] T008 [P] [US1] Unit test that Default is excluded from the flow membership index (and therefore flow details) in `PowerAutomateManager.PPTB/tests/unit/flowSolutionExclusion.test.ts` (mock `dataverseAPI.fetchXmlQuery` with a Default row + a named row)
- [X] T009 [P] [US1] Unit test that Default is excluded from the connection-reference membership index in `PowerAutomateManager.PPTB/tests/unit/connRefSolutionExclusion.test.ts`

**Checkpoint**: Default no longer appears in solution groupings or details for either category.

---

## Phase 4: User Story 2 - "None" group ordered last (Priority: P2)

**Goal**: Objects with no non-Default solution collect into a single "None" group that always sorts last at every grouping level; no "None" group when empty.

**Independent Test**: With objects only in Default, group by Solution → they appear under a single "None" group rendered after all named solution groups (and last within each parent when nested).

- [X] T010 [P] [US2] In `PowerAutomateManager.PPTB/src/features/flows/flowGrouping.ts`, the empty-solution key returns `{ key: '__none__', label: 'None', sortLast: true }`
- [X] T011 [P] [US2] In `PowerAutomateManager.PPTB/src/features/connection-references/connRefGrouping.ts`, the empty-solution key returns `{ key: '__none__', label: 'None', sortLast: true }`
- [X] T012 [P] [US2] Unit test in `PowerAutomateManager.PPTB/tests/unit/groupingSort.test.ts` that `buildForest` orders `sortLast` groups after all named groups at every level (top-level and nested)
- [X] T013 [P] [US2] Update unit tests in `PowerAutomateManager.PPTB/tests/unit/flowGrouping.test.ts` and `PowerAutomateManager.PPTB/tests/unit/connRefMapping.test.ts` to assert the empty-solution key is labeled `None` with `sortLast: true`

**Checkpoint**: "None" group is present only when needed and always last.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 Run `npm run typecheck`, `npm run lint`, and `npm test` to zero errors/failures
- [ ] T015 Run quickstart.md scenarios 1–8 against a real environment (incl. a non-English language to prove unique-name matching, and Add To Solution still lists Default)

---

## Dependencies & Execution Order

- **Setup (T001)** and **Foundational (T002–T003)** block the stories. T003 depends on T002.
- **US1 (T004–T009)**: T004/T005 (types) before T006/T007 (queries); tests after. US1 is the MVP.
- **US2 (T010–T013)**: depends on Foundational (T003) for last-ordering; independent of US1 otherwise, but both touch the same grouping files, so land US1 first.
- **Polish (T014–T015)** last; T015 requires a live environment.

### Parallel opportunities

- T001 alone in setup; T004/T005 in parallel; T008/T009 in parallel; T010/T011/T012/T013 in parallel.

## Implementation Strategy

- **MVP** = Setup + Foundational + US1 (Default excluded from groupings and details).
- Then US2 ("None" group labeled and ordered last). Both are small and can ship together.
