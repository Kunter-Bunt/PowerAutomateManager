# Research: Ordered, Sequential Flow Activation with Dependency Handling

**Feature**: 007-ordered-flow-activation | **Date**: 2026-07-24 | **Phase**: 0

## Decision 1 — Unify "ordered pass" and "retry" into one sequential executor

**Decision**: Implement a single `runSequentialActivation` that processes flows **one at a time** (awaiting each request before the next), optionally starting in a dependency-derived order, and repeats passes over still-failing flows while each pass makes progress. If a correct full order is supplied, pass 1 activates everything and the loop ends immediately (no extra passes).

**Rationale**: This satisfies FR-001 (sequential), FR-003 (single ordered pass when order is known), and FR-004–007 (retry, progress-gated, no-progress stop, always terminates) with one small, testable mechanism. The retry loop is the correctness guarantee; the order is an optimization to minimize passes.

**Alternatives considered**: Separate "ordered" and "retry" code paths — rejected (duplication; the retry path already handles everything). Parallel with concurrency limit — rejected (platform blocks parallel activation).

## Decision 2 — Termination guarantee

**Decision**: Each pass removes newly-succeeded flows from the pending set; `progressed` is true iff ≥1 flow succeeded. The loop stops when pending is empty or a pass had no success. Pending is non-increasing, so the loop runs at most N passes.

**Rationale**: FR-007 — no infinite loops for cycles or permanently-failing (e.g., managed) flows. Bounded by the number of selected flows.

**Alternatives considered**: A fixed retry count — rejected (could stop before resolving a long dependency chain, or waste passes); progress-gated is both complete and bounded.

## Decision 3 — Dependency detection (best-effort, degrade to retry)

**Decision**: `loadDependencyEdges(flowIds, signal)` probes Dataverse for child-flow dependencies among the selected flows and returns edges `[requiredId, dependentId]` (required activates first), or `null` on any error/unavailability. It uses the dependency retrieval message for `workflow` components (component type 29), keeping only edges where both endpoints are in the selection. `topologicalOrder(ids, edges)` returns the order or `null` on a cycle; a `null` order means the executor runs unordered and the retry loop resolves it.

**Rationale**: FR-002 (determine order when possible) with a guaranteed fallback (FR-004). Wrapping in `null`-on-error means correctness never depends on the probe succeeding.

**Verification note**: The exact dependency message/response shape (`RetrieveDependentComponents` / `RetrieveRequiredComponents` for component type 29, or the `dependency` records) MUST be confirmed against a real environment; the probe is defensive and any mismatch simply falls back to the retry loop. Marked as a release-time verification (like other Dataverse specifics).

**Alternatives considered**: Parsing each flow's `clientdata` for "Run a Child Flow" references — possible but fragile; the dependency message is the intended source. Either way the retry loop covers gaps.

## Decision 4 — Turn Off is the reverse order

**Decision**: For Turn Off, reverse the activation order (dependents before dependencies) and run the same executor. The "target state" is Off.

**Rationale**: FR-009 — symmetric correctness; reuses the same executor and sort.

## Decision 5 — Already-in-target-state flows

**Decision**: Before requesting, skip a flow whose current state already equals the target (from the loaded row), counting it as success and not issuing a request.

**Rationale**: FR-008 — avoids redundant requests. The current state is available on the flow's loaded record.

## Resolved unknowns

- **Sequential + ordered + retry** → one executor (Decision 1).
- **Termination** → progress-gated, non-increasing pending (Decision 2).
- **Dependency source** → best-effort Dataverse probe, `null`-on-error → retry (Decision 3); exact message verified at release.
- **Turn Off** → reverse order (Decision 4).

No open `NEEDS CLARIFICATION` items remain.
