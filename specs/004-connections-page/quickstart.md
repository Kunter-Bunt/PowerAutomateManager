# Quickstart: Connections Page

**Feature**: 004-connections-page | **Phase**: 1

Validates the Connections category inside the shell (001). Prerequisites as in [001 quickstart](../001-power-automate-manager/quickstart.md), plus:
- The active PPTB connection is **enabled for Power Platform API** (Entra app registration client id configured; `enabledForPowerPlatformAPI = true`).
- The environment has connections across multiple owners and connectors, and at least one user, team, and S2S app (application user) available as share targets.

## Build & load

```powershell
cd PowerAutomateManager.PPTB
npm run build
```

Reload the tool in PPTB. Select **Connections**.

## Validation scenarios

Mapped to [spec.md](spec.md) user stories / FRs.

1. **Details (US1, FR-001–002)**: Select one connection → details show Name, Owner, Flows Using It. A connection with no dependent flows shows the empty text.
2. **Grouping forest (US3, FR-003–006)**: Group by Owner, then "Then by" Connector → nested forest. Select an owner subtree node → all connections owned by that user selected in one action.
3. **No filters (FR-008)**: Confirm the filter/group/sort bar exposes only the universal search box (plus grouping controls) and no State/managed filters.
4. **Share (US2, FR-010–012)**: Select several connections → Share → pick a mix of a User, a Team, and an S2S App → confirm → each chosen principal is granted access to each selected connection.
5. **Share no target (edge case)**: Invoke Share and confirm with nothing selected → no sharing happens; user is prompted to choose a target.
6. **Partial failure (FR-015)**: Include a connection the current user cannot manage in the selection → the batch completes; that connection is reported as failed while others succeed.
7. **PP API disabled (prerequisite)**: With a connection not enabled for the Power Platform API, open Connections → a clear prerequisite error/empty state is shown (not a blank/frozen screen).

## Automated checks

```powershell
npm run lint
npm run typecheck
npm test -- connections
```

Expected: unit tests cover multi-type share-target resolution, per-connection failure aggregation, the disabled-PP-API degraded state, and owner/connector grouping.

## Done when

- Scenarios 1–6 pass against an environment with hundreds of connections without UI freezing, and scenario 7 shows the prerequisite state when PP API is disabled.
- Share applies to the full selection (including group-node selections) with per-connection success/failure feedback.
