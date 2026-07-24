# Feature Specification: Ordered, Sequential Flow Activation with Dependency Handling

**Feature Branch**: `007-ordered-flow-activation`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "When multiple Flows are selected and turned on (or off), it might occur that there are child flow dependencies between them. Also they can only be enabled one by one because the platform blocks parallel requests. If it is possible to predetermine with the dataverse api, activate them in the correct order right away, if that is not possible, use a retry until a loop failed to activate any single flow."

**Depends on / affects**: Feature `002-flows-page` — specifically the **Turn On** and **Turn Off** bulk actions. Refines how those actions execute; other flow actions and categories are unaffected.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Turn on interdependent flows in the correct order (Priority: P1)

A user selects several flows that have child-flow dependencies between them (one flow calls another) and turns them on. The tool determines the dependency order from the environment and activates the flows so that each flow is enabled after the flow(s) it depends on, without the user having to reorder or retry manually.

**Why this priority**: Bulk-enabling interdependent flows is the core problem — activating a parent before its child fails, so the tool must get the order right to make bulk Turn On reliable.

**Independent Test**: Select a parent flow and its child flow (both off) and Turn On; confirm both end up on, with the child activated before the parent.

**Acceptance Scenarios**:

1. **Given** a set of selected flows where flow A depends on flow B, **When** the user turns them on, **Then** flow B is activated before flow A.
2. **Given** the dependency order can be determined from the environment, **When** the user turns the flows on, **Then** all flows are activated on the first ordered pass without needing a retry.
3. **Given** flows with no dependencies among them, **When** the user turns them on, **Then** they are all activated (order does not matter for correctness).

---

### User Story 2 - Activate one flow at a time (Priority: P1)

Because the platform blocks parallel activation requests, the tool enables the selected flows strictly one at a time (sequentially), never issuing concurrent activation requests.

**Why this priority**: Parallel requests are rejected by the platform, so sequential execution is required for any multi-flow Turn On/Off to work at all.

**Independent Test**: Turn on multiple flows and confirm activation requests are issued sequentially (one completes before the next begins), not in parallel.

**Acceptance Scenarios**:

1. **Given** multiple selected flows, **When** the user turns them on, **Then** the tool issues activation requests one at a time.
2. **Given** an activation in progress, **When** the tool processes the batch, **Then** it does not start another flow's activation until the current one completes.

---

### User Story 3 - Retry loop when the order cannot be predetermined (Priority: P2)

When the dependency order cannot be reliably determined from the environment, the tool falls back to a retry strategy: it attempts to activate the remaining flows one by one, and repeats passes over the still-inactive flows. It keeps going as long as each pass activates at least one flow, and stops when a full pass activates none — reporting the remaining flows as failures.

**Why this priority**: A robust fallback guarantees the feature works even when dependency data is missing or incomplete, but it is secondary to the direct ordered path.

**Independent Test**: With dependency detection disabled/unavailable, turn on interdependent flows and confirm they eventually all activate across multiple passes; with a flow that can never activate, confirm the loop stops after a pass with no progress and reports it.

**Acceptance Scenarios**:

1. **Given** the order is unknown and flow A depends on flow B, **When** the tool retries, **Then** B activates on an early pass and A activates on a later pass once B is on.
2. **Given** a pass over the remaining flows activates at least one flow, **When** the pass completes, **Then** the tool runs another pass over those still inactive.
3. **Given** a full pass activates no flow, **When** the pass completes, **Then** the tool stops and reports the still-inactive flows as failures.
4. **Given** a flow that can never be activated (e.g., a managed flow that cannot be modified), **When** the retry loop runs, **Then** the loop terminates (no infinite retries) and that flow is reported as failed.

---

### User Story 4 - Turn off in reverse dependency order (Priority: P2)

Turning off interdependent flows applies the reverse of the activation order (a dependent/parent flow is turned off before the flow it depends on), using the same predetermined-order-or-retry strategy.

**Why this priority**: Symmetric correctness for Turn Off avoids leaving a flow depending on one that was just disabled, but it mirrors the Turn On behavior rather than introducing new capability.

**Independent Test**: Turn off a parent and its child (both on) and confirm the parent is turned off before the child, and both end up off.

**Acceptance Scenarios**:

1. **Given** flow A depends on flow B and both are on, **When** the user turns them off, **Then** A is turned off before B.
2. **Given** the order cannot be determined, **When** the user turns them off, **Then** the retry loop applies until no further flow can be turned off in a pass.

---

### Edge Cases

- **Circular dependencies**: If two flows depend on each other, a strict order cannot be formed; the retry loop handles it (either the platform allows one first, or both are reported as failures when no pass makes progress).
- **Flows already in the target state**: A flow already on (for Turn On) is treated as success and not re-requested.
- **Managed / unauthorized flows**: A flow that cannot be modified fails every attempt; it does not cause an infinite loop and is reported as failed.
- **Partial success**: Some flows activate and some don't; the tool reports per-flow outcomes and leaves successfully changed flows changed.
- **Dependencies on flows outside the selection**: Only ordering among the selected flows is considered; a dependency on an unselected flow is not activated by this action (and may cause that flow's activation to fail, handled by the retry loop and reported).
- **Large selections**: Sequential processing may take a while; progress remains visible per flow and the UI stays responsive (per the existing non-blocking behavior).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Turn On and Turn Off bulk actions for Flows MUST activate/deactivate the selected flows strictly sequentially (one at a time), never issuing parallel activation requests.
- **FR-002**: When turning flows on, the tool MUST attempt to determine child-flow dependency relationships among the selected flows from the environment (Dataverse) and, when determinable, activate the flows in dependency order (a flow is activated after the flow(s) it depends on).
- **FR-003**: When the dependency order among the selected flows can be fully determined, the tool MUST activate them in that order in a single ordered pass (no unnecessary retries).
- **FR-004**: When the dependency order cannot be reliably or fully determined, the tool MUST fall back to a retry strategy: repeatedly attempt the still-inactive flows one by one across successive passes.
- **FR-005**: The retry strategy MUST continue to the next pass only if the current pass changed at least one flow to the target state.
- **FR-006**: The retry strategy MUST stop when a full pass changes no flow, and MUST report the remaining flows as failures.
- **FR-007**: The retry strategy MUST terminate for any input (no infinite loops), including circular dependencies and permanently-failing flows.
- **FR-008**: A flow already in the target state MUST be treated as a success and MUST NOT be re-requested.
- **FR-009**: Turn Off MUST apply the reverse of the activation order (a dependent flow is turned off before the flow it depends on), using the same determinable-order-or-retry strategy.
- **FR-010**: The tool MUST report per-flow success/failure outcomes for the whole operation, consistent with existing bulk-action feedback.
- **FR-011**: Flows successfully changed MUST remain changed even if others in the batch fail.
- **FR-012**: This ordering/retry behavior MUST apply only to the Flows Turn On and Turn Off actions; other actions and categories are unchanged.

### Key Entities *(include if feature involves data)*

- **Flow dependency**: A relationship where one selected flow (parent) invokes/depends on another selected flow (child), used to derive activation order. Sourced from the environment's dependency information.
- **Activation order**: The sequence in which selected flows are turned on (dependencies first) or off (dependents first).
- **Retry pass**: One sequential sweep over the still-inactive flows; progress in a pass (≥1 change) permits another pass, no progress ends the loop.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Turning on a set of interdependent flows results in all activatable flows ending up on, without the user manually reordering or re-running the action.
- **SC-002**: The tool never issues parallel activation requests; activation requests are strictly sequential 100% of the time.
- **SC-003**: When dependency order is fully determinable, all flows activate in a single ordered pass (no retries needed).
- **SC-004**: When order is not determinable, interdependent flows still all activate via retries, and the process always terminates.
- **SC-005**: A batch containing a permanently-failing flow terminates and reports that flow as failed without an infinite loop.
- **SC-006**: Per-flow success/failure is reported for the entire operation, and successfully changed flows stay changed.

## Assumptions

- Child-flow dependencies among flows are discoverable via the Dataverse dependency information for `workflow` components; if that information is unavailable or incomplete for a given selection, the retry strategy is used.
- "One by one" means no concurrency for activation requests; the existing per-object busy indicators continue to reflect progress.
- Turn Off order is the reverse of the Turn On (activation) order.
- Only dependencies among the currently selected flows affect ordering; dependencies on unselected flows are not resolved by this action.
- Circular dependencies are resolved (if at all) by the retry loop; if unresolvable, the involved flows are reported as failures rather than retried forever.
- This refines the Flows Turn On/Off actions only; Change Owner, Add To Solution, and all other categories are unaffected.
- The existing non-blocking operation behavior (feature `006`) still applies: the UI stays responsive and per-flow progress is visible during the sequential process.
