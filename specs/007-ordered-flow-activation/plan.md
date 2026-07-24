# Implementation Plan: Ordered, Sequential Flow Activation with Dependency Handling

**Branch**: `007-ordered-flow-activation` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-ordered-flow-activation/spec.md`

## Summary

Replace the current parallel Turn On/Off implementation for Flows with a **sequential** executor that (a) attempts to determine child-flow dependency order among the selected flows from Dataverse and activates in that order, and (b) falls back to a **retry loop** (repeat passes over still-inactive flows; continue while a pass makes progress; stop on a no-progress pass) that guarantees termination for cycles and permanently-failing flows. Per-flow outcomes are reported as today.

Technical approach: a pure, well-tested `runSequentialActivation` executor + a pure `topologicalOrder` sort, plus a best-effort Dataverse dependency probe. Turn On uses dependency order (required first); Turn Off uses the reverse. If dependency data is unavailable, the same executor runs unordered and the retry loop resolves ordering.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — inherits the tool.

**Primary Dependencies**: React 18, existing flows feature + `dataverseClient`. No new dependencies. Removes the parallel `runBatched` usage for Turn On/Off.

**Storage**: None. Reads dependency info and writes `workflow` state through the host `dataverseAPI`.

**Testing**: Vitest. Pure unit tests for `topologicalOrder` (order, cycle → null, intra-selection filtering) and `runSequentialActivation` (sequential awaits, ordered single pass, retry progress, no-progress stop, termination, per-flow failures, already-in-state skip). Mocked `dataverseAPI` for the Turn On/Off actions.

**Target Platform**: PPTB sandboxed iframe (unchanged).

**Project Type**: Single-project web app — changes within `src/features/flows/`.

**Performance Goals**: Correctness over speed; sequential by requirement. Bounded passes (≤ N) guarantee termination.

**Constraints**: No parallel activation requests (platform blocks them). Retry loop must always terminate. Only Flows Turn On/Off affected.

**Scale/Scope**: Dozens–hundreds of selected flows; sequential.

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Strict TS; small pure functions (topo sort, executor); no `any` | PASS |
| II. UX Consistency | Host APIs only; feedback via existing per-object outcome reporting | PASS |
| III. Performance | Sequential is required by the platform (parallel is rejected); dependency probe is best-effort and bounded; retry loop bounded by no-progress stop | PASS — sequential is the correct/required behavior here |
| IV. Minimal Comments & Small Functions | Executor/sort as small named units; comments only for the WHY (platform blocks parallel) | PASS |

**Result**: PASS. No violations — Complexity Tracking not required.

> **Performance note (Principle III)**: Parallelism is intentionally removed for Turn On/Off because the platform rejects concurrent activation requests; this is a correctness requirement, not a regression. The dependency probe adds at most a bounded number of read calls and degrades to the retry loop on any failure.

## Project Structure

### Documentation (this feature)

```text
specs/007-ordered-flow-activation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── activation.md
└── checklists/requirements.md
```

### Source Code (files touched)

```text
PowerAutomateManager.PPTB/src/features/flows/
├── flowDependencies.ts     # NEW: topologicalOrder(ids, edges) + best-effort loadDependencyEdges(ids, signal)
├── flowActivation.ts       # NEW: runSequentialActivation(flows, target, signal) + runSequentialRetry(flows, opts)
└── flowActions.ts          # Turn On/Off delegate to flowActivation (replace parallel setFlowState)
```

**Structure Decision**: Contained entirely within `src/features/flows/`. The executor and sort are pure and unit-tested; the Dataverse dependency probe is best-effort and returns `null` (→ retry path) on any error, so correctness never depends on it.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
