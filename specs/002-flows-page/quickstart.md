# Quickstart: Flows Page

**Feature**: 002-flows-page | **Phase**: 1

Validates the Flows category inside the shell (001). Prerequisites as in [001 quickstart](../001-power-automate-manager/quickstart.md), plus an environment containing cloud flows across multiple solutions, some On and some Off, some managed.

## Build & load

```powershell
cd PowerAutomateManager.PPTB
npm run build
```

Reload the tool in PPTB (Debug → reopen). Select **Flows** in the navigation.

## Validation scenarios

Mapped to [spec.md](spec.md) user stories / FRs.

1. **Details (US1, FR-001–002)**: Select one flow → details show Name, Owner, State, Solutions, Connection References Used. A flow in multiple solutions lists all; a flow with none shows the empty text.
2. **Color coding (US5, FR-003/FR-026–027)**: On flows render with the positive accent + "On" badge; Off flows negative accent + "Off" badge; both readable in light and dark themes.
3. **Grouping forest (US3, FR-005–008)**: Group by Solution, then "Then by" State → nested forest. Select a solution's Off subtree node → all Off flows in that solution selected in one action. A flow in two solutions appears under both (FR-032) but is selected/acted upon once (FR-033).
4. **Filters (US4, FR-011–013)**: Apply State=Off → only Off flows; add Managed=Unmanaged → intersection; combine with search → all constraints applied; clear → full list.
5. **Turn On/Off (US2, FR-015)**: Select several Off flows → Turn On → they become On (row color updates after refresh). Repeat Turn Off.
6. **Change Owner (US2, FR-016)**: Select flows → Change Owner → pick a user → owner updates; invoking with no user chosen prompts and does nothing.
7. **Add To Solution (US2, FR-017)**: Select flows → Add To Solution → pick a solution → flows added; details Solutions list reflects it.
8. **Partial failure (FR-020/FR-043)**: Include a managed flow that cannot be modified in a Turn On/Off selection → the batch completes; the managed flow is reported as failed while others succeed.

## Automated checks

```powershell
npm run lint
npm run typecheck
npm test -- flows
```

Expected: unit tests cover the forest builder (multi-level, multi-solution duplication), selection de-dup across duplicate groups, statecode mapping, and per-flow failure aggregation from `runBatched`.

## Done when

- All 8 scenarios pass against an environment with hundreds of flows without UI freezing.
- Bulk actions report per-flow success/failure and refresh affected rows.
