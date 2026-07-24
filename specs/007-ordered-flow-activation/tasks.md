---
description: "Task list for feature 007 - Ordered, Sequential Flow Activation with Dependency Handling"
---

# Tasks: Ordered, Sequential Flow Activation with Dependency Handling

**Input**: Design documents from `/specs/007-ordered-flow-activation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/. **Refines the Flows Turn On/Off actions (feature `002`).**

**Tests**: Included (Vitest, pure + mocked host).

**Organization**: Grouped by user story. Source paths under `PowerAutomateManager.PPTB/src/features/flows/`.

## Phase 1: Setup

- [X] T001 [P] Create `PowerAutomateManager.PPTB/src/features/flows/flowDependencies.ts` with a `DependencyEdge` type and a `topologicalOrder(ids, edges)` returning ordered ids (required first) or `null` on a cycle, filtering to intra-selection edges

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Create `PowerAutomateManager.PPTB/src/features/flows/flowActivation.ts` with `runSequentialRetry(flows, opts)` — sequential (await each), ordered-if-provided, progress-gated retry, no-progress stop, already-in-state skip, returns per-flow failures (depends on T001)

**Checkpoint**: Pure executor + sort available.

---

## Phase 3: User Story 2 - Sequential activation (Priority: P1) 🎯 MVP

**Goal**: Flows are turned on/off strictly one at a time.

**Independent Test**: Turn on several flows → requests are issued sequentially, not in parallel.

- [X] T003 [US2] Implement `activateFlows(flows, target, signal)` in `PowerAutomateManager.PPTB/src/features/flows/flowActivation.ts` (map target → statecode/statuscode; `activate` = `dv.update('workflow', id, {statecode, statuscode})`; run `runSequentialRetry`)
- [X] T004 [US2] Wire Turn On/Turn Off in `PowerAutomateManager.PPTB/src/features/flows/flowActions.ts` to `activateFlows` (replace the parallel `runBatched` `setFlowState`)
- [X] T005 [P] [US2] Unit test that `runSequentialRetry` awaits each activation before the next (no concurrency) in `PowerAutomateManager.PPTB/tests/unit/flowActivation.test.ts`

---

## Phase 4: User Story 1 - Ordered Turn On (Priority: P1)

**Goal**: When dependency order is determinable, activate in order (required first) in a single pass.

**Independent Test**: Parent + child (both off) → child activated before parent, one pass.

- [X] T006 [US1] Implement best-effort `loadDependencyEdges(ids, signal)` in `PowerAutomateManager.PPTB/src/features/flows/flowDependencies.ts` (probe Dataverse child-flow dependencies for `workflow` componenttype 29; both endpoints in selection; `null` on any error)
- [X] T007 [US1] Use `loadDependencyEdges` + `topologicalOrder` in `activateFlows` to derive the order (required first) before running the executor
- [X] T008 [P] [US1] Unit test `topologicalOrder` (order, cycle → null, intra-selection filtering, self-edge ignored) in `PowerAutomateManager.PPTB/tests/unit/flowDependencies.test.ts`
- [X] T009 [P] [US1] Unit test that a correct order activates all flows in a single pass (no retries) in `PowerAutomateManager.PPTB/tests/unit/flowActivation.test.ts`

---

## Phase 5: User Story 3 - Retry loop fallback (Priority: P2)

**Goal**: When order is unknown, retry passes resolve interdependencies and always terminate.

**Independent Test**: Unordered interdependent flows all activate across passes; a never-activatable flow stops the loop after a no-progress pass.

- [X] T010 [P] [US3] Unit test the retry loop: unordered flows that fail then succeed on later passes; no-progress pass stops and reports failures; termination for a permanently-failing flow in `PowerAutomateManager.PPTB/tests/unit/flowActivation.test.ts`
- [X] T011 [P] [US3] Unit test already-in-target-state flows are counted as success without a request in `PowerAutomateManager.PPTB/tests/unit/flowActivation.test.ts`

---

## Phase 6: User Story 4 - Turn Off reverse order (Priority: P2)

**Goal**: Turn Off uses the reverse of the activation order.

**Independent Test**: Parent + child (both on) → parent off before child.

- [X] T012 [US4] Ensure `activateFlows(..., 'off', ...)` reverses the derived order in `PowerAutomateManager.PPTB/src/features/flows/flowActivation.ts`
- [X] T013 [P] [US4] Unit test Turn Off reverses order and sets Off state in `PowerAutomateManager.PPTB/tests/unit/flowActivation.test.ts`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T014 [P] Update/keep `PowerAutomateManager.PPTB/tests/unit/flowActions.test.ts` green (Turn On/Off now sequential via `activateFlows`; assert statecode/statuscode + per-flow failure)
- [X] T015 Run `npm run typecheck`, `npm run lint`, and `npm test` to zero errors/failures
- [ ] T016 Run quickstart.md scenarios 1–7 against a real environment (incl. verifying the dependency probe response shape)

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002)** blocks the stories.
- **US2 (T003–T005)** is the MVP (sequential). **US1 (T006–T009)** adds ordering. **US3 (T010–T011)** and **US4 (T012–T013)** exercise the same executor.
- **Polish (T014–T016)** last; T016 needs a live environment.

### Parallel opportunities

- T001 alone; test tasks T005/T008/T009/T010/T011/T013/T014 are independent.

## Implementation Strategy

- **MVP** = Setup + Foundational + US2 (sequential Turn On/Off) — already fixes the parallel-request problem.
- Then US1 (dependency ordering), with US3/US4 covering retry and reverse order. The retry loop guarantees correctness even if the dependency probe returns nothing.
