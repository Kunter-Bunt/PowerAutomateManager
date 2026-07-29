---
description: "Task list for feature 004 - Connections Page"
---

# Tasks: Connections Page

**Input**: Design documents from `/specs/004-connections-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/. **Depends on feature `001` shell**; reuses the connection↔connection-reference↔flow index from features `002`/`003`.

**Tests**: Included (Vitest + RTL, mocked host APIs).

**Organization**: Grouped by user story (US1–US3). Source paths under `PowerAutomateManager.PPTB/src/features/connections/`.

## Phase 1: Setup

- [X] T001 Create `PowerAutomateManager.PPTB/src/features/connections/` and register a placeholder `connectionsModule` (id `connections`) in `PowerAutomateManager.PPTB/src/categories/registry.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Implement queries in `PowerAutomateManager.PPTB/src/features/connections/connectionQueries.ts` (list connections via `powerPlatformClient` Connectivity namespace; guard on `connection.enabledForPowerPlatformAPI` → typed PrerequisiteError; map owner/connector)
- [X] T003 Implement `connectionsModule.loadItems` in `PowerAutomateManager.PPTB/src/features/connections/connectionsModule.ts` (map connection → ListItem, searchText=name, secondary=connector; build connection↔connection-reference↔flow index for "flows using it")

**Checkpoint**: Connection list data available to all stories.

---

## Phase 3: User Story 1 - Inspect connection details (Priority: P1) 🎯 MVP

**Goal**: Details form shows Name, Owner, Flows Using It.

**Independent Test**: Select connections and confirm the three detail fields populate; no dependent flows shows empty text.

- [X] T004 [US1] Implement `PowerAutomateManager.PPTB/src/features/connections/connectionDetails.ts` (record → DetailField[]: Name, Owner, Flows Using It list)
- [X] T005 [US1] Wire `getDetails` into `connectionsModule` in `PowerAutomateManager.PPTB/src/features/connections/connectionsModule.ts`
- [X] T006 [P] [US1] Unit test details mapping + flows-using derivation in `PowerAutomateManager.PPTB/tests/unit/connectionMapping.test.ts`

---

## Phase 4: User Story 2 - Share connections (Priority: P1)

**Goal**: Share action lets the user pick Service Principals, uses their Enterprise Application IDs, and grants each access to the selected connections, with per-connection failure reporting.

**Independent Test**: Share several connections with one or more Service Principals; no-target prompts; Teams and individual users are unavailable; unmanageable connections report as failures.

- [X] T007 [US2] Implement the Service Principal picker in `PowerAutomateManager.PPTB/src/features/connections/connectionShare.ts` (load connection role assignments through the Power Apps for Admins API; retain only `ServicePrincipal` principals and their Enterprise Application IDs; Teams and individual users excluded)
- [X] T008 [US2] Implement the Share run in `PowerAutomateManager.PPTB/src/features/connections/connectionShare.ts` (grant permission through the Power Apps for Admins `modifyPermissions` route using the Enterprise Application ID and `ServicePrincipal` type; execute with `runBatched`; per-connection failures; no-target → no-op + prompt)
- [X] T009 [US2] Register the Share `toolbarAction` in `connectionsModule` and refresh affected rows in `PowerAutomateManager.PPTB/src/features/connections/connectionsModule.ts`
- [X] T010 [P] [US2] Unit test Service Principal resolution, Enterprise Application ID payloads, per-connection failure aggregation, and no-target path in `PowerAutomateManager.PPTB/tests/unit/connectionShare.test.ts`

---

## Phase 5: User Story 3 - Group connections into a selectable forest (Priority: P2)

**Goal**: Group by Owner or Connector with "Then by"; tree/subtree single-action selection.

**Independent Test**: Group by Owner then Connector; select an owner subtree; all connections owned by that user selected in one action.

- [X] T011 [US3] Implement `PowerAutomateManager.PPTB/src/features/connections/connectionGrouping.ts` (Owner/Connector GroupingOption)
- [X] T012 [US3] Wire grouping into the FilterBar slot + forest render + node selection via `SelectionModel.selectIds`
- [X] T013 [P] [US3] Unit test forest builder + owner/connector grouping in `PowerAutomateManager.PPTB/tests/unit/connectionMapping.test.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T014 [US2] Implement the disabled-Power-Platform-API degraded state (clear prerequisite error/empty state) in `PowerAutomateManager.PPTB/src/features/connections/connectionsModule.ts`
- [ ] T015 Verify the Power Apps for Admins connection-permissions path/payload and Service Principal principal shape against the environment; update `connectionShare.ts`
- [X] T016 [P] Run `npm run lint` and `npm run typecheck` to zero errors; confirm no category filters render (only search + grouping)
- [ ] T017 Run connections quickstart.md scenarios 1–7 against a real environment (incl. scenario 7 with PP API disabled)
- [ ] T018 [P] Performance pass with hundreds of connections

---

## Dependencies & Execution Order

- Requires feature `001` shell; reuses the flow index from `002`/`003`.
- **Setup (T001)** → **Foundational (T002–T003)** blocks all stories.
- **US1 (T004–T006)** MVP; **US2 (T007–T010)** core value; **US3 (T011–T013)** after foundation.
- **Polish (T014–T018)** last (T015 verification should precede release).

### Parallel opportunities

- Test tasks T006, T010, T013 run in parallel.

## Implementation Strategy

- **MVP** = Setup + Foundational + US1 (connection details).
- Then US2 (Share) for core value, followed by US3 (grouping). Note the Power Platform API prerequisite (T014/T015) for this category.
