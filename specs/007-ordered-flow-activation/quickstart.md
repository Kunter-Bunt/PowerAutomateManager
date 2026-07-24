# Quickstart: Ordered, Sequential Flow Activation

**Feature**: 007-ordered-flow-activation | **Phase**: 1

Validates dependency-ordered, sequential Turn On/Off with a retry fallback. Prerequisites as in the [001 quickstart](../001-power-automate-manager/quickstart.md), plus an environment with interdependent flows (a parent that calls a child), some off and some on, and ideally a managed flow.

## Build & load

```powershell
cd PowerAutomateManager.PPTB
npm run build
```

Reload the tool in PPTB. Open **Flows**.

## Validation scenarios

Mapped to [spec.md](spec.md).

1. **Ordered Turn On (US1, FR-002/FR-003)**: Select a parent + its child (both off) and Turn On → both end on, child activated before parent, in one pass.
2. **Sequential (US2, FR-001)**: Turn on several flows → activation requests are issued one at a time (no parallel), so no platform "parallel request" rejections occur.
3. **Retry fallback (US3, FR-004–006)**: In a selection where the order isn't determinable, interdependent flows still all activate across passes; a flow that can never activate is reported after a no-progress pass.
4. **Termination (FR-007)**: Include a managed flow that can't be modified → the operation ends (no hang) and reports that flow as failed.
5. **Already-on skip (FR-008)**: Include a flow already on → it's reported as success without a redundant request.
6. **Turn Off reverse order (US4, FR-009)**: Turn off a parent + child (both on) → parent off before child; both end off.
7. **Partial success (FR-010/FR-011)**: A batch with one failing flow → others succeed and stay changed; the failure is reported per flow.

## Automated checks

```powershell
npm run lint
npm run typecheck
npm test -- flowActivation flowDependencies flowActions
```

Expected: unit tests cover `topologicalOrder` (order, cycle → null, intra-selection filtering), `runSequentialRetry` (sequential awaits, ordered single pass, retry progress, no-progress stop, termination, already-in-state skip, per-flow failures), and Turn On/Off delegating to the executor.

## Done when

- Scenarios 1–7 pass against a real environment.
- Turn On/Off never issue parallel requests; interdependent flows activate correctly; the process always terminates and reports per-flow outcomes.
