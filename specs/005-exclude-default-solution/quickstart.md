# Quickstart: Exclude Default Solution from Groupings and Listings

**Feature**: 005-exclude-default-solution | **Phase**: 1

Validates that the Default solution is excluded from Solution groupings and details, and that the "None" group sorts last. Prerequisites as in the [001 quickstart](../001-power-automate-manager/quickstart.md), plus an environment where objects belong to the Default solution plus (for some) other solutions, and some objects belong only to Default.

## Build & load

```powershell
cd PowerAutomateManager.PPTB
npm run build
```

Reload the tool in PPTB.

## Validation scenarios

Mapped to [spec.md](spec.md) requirements.

1. **Grouping excludes Default (US1, FR-002)**: Group Flows by Solution → no group represents the Default solution. Repeat for Connection References.
2. **Details exclude Default (US1, FR-003)**: Open a flow that is in Default plus one other solution → the "Solutions" list shows only the other solution.
3. **Language independence (SC-003, FR-001)**: With a non-English UI language (Default's display name differs), confirm Default is still excluded (matched by unique name).
4. **"None" group appears (US2, FR-005/FR-006/FR-012)**: With flows that are only in the Default solution (or in no solution), group by Solution → those flows appear under a single group labeled **None**.
5. **"None" sorts last (US2, FR-007)**: Confirm the None group renders after all named solution groups. Then Group by Solution → Then by is not needed; add "Then by" with Solution swapped to a nested level (e.g., group by State then Solution) and confirm None is last within each parent group.
6. **No "None" when empty (FR-008)**: In a slice where every flow is in a non-Default solution, confirm no None group is shown.
7. **Objects not removed (SC-005, FR-004)**: Confirm total flow count is unchanged after excluding Default (objects only move groups, none disappear).
8. **Add To Solution unchanged (FR-011)**: Open Add To Solution → the Default solution is still selectable as a target.

## Automated checks

```powershell
npm run lint
npm run typecheck
npm test -- solutions grouping flowGrouping connRefMapping
```

Expected: unit tests cover `isDefaultSolution`, Default exclusion in the membership indices, the `None`/`sortLast` grouping key, and `buildForest` ordering `sortLast` groups last at every level.

## Done when

- Scenarios 1–8 pass against a real environment.
- No Solution group represents the Default solution; the "None" group, when present, is always last.
