# Quickstart: Connection References Page

**Feature**: 003-connection-references-page | **Phase**: 1

Validates the Connection References category inside the shell (001). Prerequisites as in [001 quickstart](../001-power-automate-manager/quickstart.md), plus an environment with connection references across multiple solutions and connectors, including at least two references sharing one connector and some belonging to multiple solutions.

## Build & load

```powershell
cd PowerAutomateManager.PPTB
npm run build
```

Reload the tool in PPTB. Select **Connection References**.

## Validation scenarios

Mapped to [spec.md](spec.md) user stories / FRs.

1. **Details (US1, FR-001–002)**: Select one reference → details show Name, Connection, Solutions, Flows Using It. Multiple flows/solutions all list; unassigned connection / no flows show empty text.
2. **Grouping forest (US4, FR-003–008)**: Group by Connector, then "Then by" Solution → nested forest. Select a connector subtree node → all references using that connector selected in one action. A reference in two solutions appears under both but is acted upon once (FR-010).
3. **Managed filter (US5, FR-009)**: Apply Managed=Unmanaged → only unmanaged references; combine with search; clear → full list.
4. **Change Connection (US3, FR-012)**: Select references sharing a connector → Change Connection → picker shows only that connector's connections → pick one → references repointed (details Connection updates). Invoking with no target prompts and does nothing.
5. **Add To Solution (US3, FR-013)**: Select references → Add To Solution → pick an unmanaged solution → added (details Solutions reflect it).
6. **Merge success (US2, FR-014–016)**: Select 2+ references sharing one connector → Merge → choose a master connection (connector-filtered) → all selected references now point to the master connection.
7. **Merge blocked (US2, FR-015)**: Select references spanning two connectors → Merge is disabled/blocked with the "same connector" explanation.
8. **Partial failure (FR-020)**: Include a managed reference that cannot be modified in a Change/Merge selection → batch completes; that reference reported as failed while others succeed.

## Automated checks

```powershell
npm run lint
npm run typecheck
npm test -- connection-references
```

Expected: unit tests cover the same-connector Merge gate, connector-filtered picker options, forest builder with multi-solution duplication, selection de-dup, and per-reference failure aggregation.

## Done when

- All 8 scenarios pass against an environment with hundreds of references without UI freezing.
- Merge is prevented across differing connectors 100% of the time and consolidates onto the master connection when valid.
