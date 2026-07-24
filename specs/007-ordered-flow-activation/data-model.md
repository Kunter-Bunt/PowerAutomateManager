# Data Model: Ordered, Sequential Flow Activation

**Feature**: 007-ordered-flow-activation | **Date**: 2026-07-24 | **Phase**: 1

No domain schema changes. New in-memory structures only.

## Types

### DependencyEdge
- `[requiredId: string, dependentId: string]` — the required flow must be activated before the dependent flow.

### SequentialActivationOptions
- `order?: string[]` — preferred processing order of flow ids (dependencies first for Turn On; reversed for Turn Off).
- `isInTargetState(flow: ListItem): boolean` — true when the flow already has the target state (skip + count as success).
- `activate(flow: ListItem): Promise<void>` — performs the single state change; rejects on failure.

### ActivationTarget
- `'on' | 'off'` — maps to `{ statecode, statuscode }` (On = 1/2, Off = 0/1) and to order direction (Off reverses).

## Rules

- **Sequential**: `activate` is awaited for each flow before the next begins — never concurrent (FR-001).
- **Ordering**: when `order` is provided, pending flows are processed in that order; unknown ids go last (FR-002/FR-003).
- **Retry pass**: one sweep over pending flows; successes are removed; `progressed = (≥1 success)`.
- **Loop control**: repeat while `pending` non-empty AND the last pass `progressed`; otherwise stop (FR-005/FR-006).
- **Termination**: `pending` is non-increasing → at most N passes (FR-007).
- **Already-in-state**: skipped and counted as success (FR-008).
- **Result**: flows never succeeding are returned as `{ id, reason }[]`; a non-empty list → `{ ok:false, failures }` (FR-010/FR-011).
- **Turn Off**: same executor with reversed order and Off target (FR-009).
- **Edge filtering**: only edges with both endpoints in the selection influence ordering; `topologicalOrder` returns `null` on a cycle → unordered + retry.

## Entities (conceptual)

- **Flow dependency** — a `[required, dependent]` edge among selected flows.
- **Activation order** — topological order (required first) for On; reversed for Off.
- **Retry pass** — one sequential sweep; progress permits another pass.
