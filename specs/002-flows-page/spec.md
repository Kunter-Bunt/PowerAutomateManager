# Feature Specification: Flows Page

**Feature Branch**: `002-flows-page`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "The details screen of flows shall show the name, owner, solutions the flow is part of, connection references used by the flow and the state. The list of flows shall be colored based on the state (on green, off red). The grouping options are by solution, state, owner. If a grouping was selected, a Then by appears to select a second or even third one. Grouping create a forest that allow to select everything within the current tree or subtree. This will for example allow to select all Off flows within a certain solution with one click. If a flow is in multiple solutions, it is shown multiple times. Filters have options for state, managed/unmanaged. Toolbar has buttons for Turn On, Turn Off, Change Owner, Add To Solution."

**Depends on**: Feature `001-power-automate-manager` (base tool shell — left navigation, per-category list, right details panel, CTRL/SHIFT multi-select, common toolbar actions, and the filter/group/sort bar with search). This feature specializes the **Flows** category of that shell.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect flow details (Priority: P1)

When a single Flow is selected in the Flows list, the right-hand details form shows the flow's name, owner, the solutions the flow is part of, the connection references the flow uses, and the flow's state.

**Why this priority**: Flows are the primary object of the tool. Understanding a flow's owner, solution membership, dependencies (connection references), and state is essential before taking any management action.

**Independent Test**: Select individual flows and confirm the details form shows name, owner, associated solutions, the connection references the flow uses, and current state for each.

**Acceptance Scenarios**:

1. **Given** the Flows list is shown, **When** the user selects a single flow, **Then** the details form shows the flow's name, owner, solutions it belongs to, the connection references it uses, and its state.
2. **Given** a flow that belongs to multiple solutions, **When** its details are shown, **Then** all solutions the flow is part of are listed.
3. **Given** a flow that uses one or more connection references, **When** its details are shown, **Then** each connection reference used by the flow is listed.
4. **Given** a flow with no connection references or no solution, **When** its details are shown, **Then** those fields show an explicit empty indication rather than being blank or erroring.

---

### User Story 2 - Perform bulk flow actions (Priority: P1)

The toolbar provides Turn On, Turn Off, Change Owner, and Add To Solution actions that operate on the currently selected flows (including flows selected via group-node selection).

**Why this priority**: Bulk actions are the core management value of the Flows page, delivering the payoff of selection, grouping, and filtering.

**Independent Test**: Select several flows, invoke each action (Turn On, Turn Off, Change Owner, Add To Solution), and confirm the action applies to all selected flows with clear success/failure feedback and the list reflecting the result.

**Acceptance Scenarios**:

1. **Given** one or more flows are selected, **When** the user clicks Turn On, **Then** the selected flows are enabled and their state/color updates.
2. **Given** one or more flows are selected, **When** the user clicks Turn Off, **Then** the selected flows are disabled and their state/color updates.
3. **Given** one or more flows are selected, **When** the user clicks Change Owner and chooses a new owner, **Then** the selected flows are reassigned to that owner.
4. **Given** one or more flows are selected, **When** the user clicks Add To Solution and chooses a solution, **Then** the selected flows are added to that solution.
5. **Given** a bulk action partially fails, **When** it completes, **Then** the user is shown which flows succeeded and which failed.

---

### User Story 3 - Group flows into a selectable forest (Priority: P2)

The user groups the Flows list by Solution, State, or Owner. After choosing a first grouping, a "Then by" control appears to add a second and then a third grouping level. Grouping arranges flows into a forest of expandable group nodes, and selecting a group node selects every flow within that tree or subtree in one action — for example, selecting all Off flows within a specific solution.

**Why this priority**: Grouping plus tree/subtree selection is what makes bulk actions efficient at scale, but per-object selection still works without it.

**Independent Test**: Group by Solution, then by State; expand a solution's Off subtree; select that subtree node and confirm all Off flows within that solution become selected in one action.

**Acceptance Scenarios**:

1. **Given** the Flows list, **When** the user selects a grouping of Solution, State, or Owner, **Then** the list is reorganized into groups by that attribute.
2. **Given** a first grouping is selected, **When** the user opens "Then by", **Then** they can add a second grouping level, and after that a third.
3. **Given** a multi-level grouping, **When** the list renders, **Then** flows are shown as a forest of nested group nodes reflecting the grouping order.
4. **Given** a group node (tree or subtree), **When** the user selects that node, **Then** all flows contained within it are selected in a single action.
5. **Given** grouping by Solution, **When** a flow belongs to multiple solutions, **Then** that flow appears once under each solution it belongs to.

---

### User Story 4 - Filter flows by state and managed status (Priority: P2)

The filter/group/sort bar lets the user narrow the Flows list by State and by managed/unmanaged status.

**Why this priority**: Filtering complements search and grouping to isolate the relevant flows before acting, but the page remains usable without it.

**Independent Test**: Apply a State filter and confirm only flows in that state remain; apply a managed/unmanaged filter and confirm only flows of that management type remain; combine both and confirm the intersection is shown.

**Acceptance Scenarios**:

1. **Given** the Flows list, **When** the user applies a State filter, **Then** only flows in the selected state(s) are shown.
2. **Given** the Flows list, **When** the user applies a managed/unmanaged filter, **Then** only flows of the selected management type are shown.
3. **Given** an active filter, **When** the user clears the filter, **Then** the full list is restored.
4. **Given** an active filter combined with a search term, **When** results are computed, **Then** only flows matching both the filter and the search are shown.

---

### User Story 5 - Identify flow state at a glance (Priority: P3)

Rows in the Flows list are color-coded by state so the user can distinguish enabled from disabled flows without opening details: On flows are shown green, Off flows are shown red.

**Why this priority**: Visual state cues speed up triage across large lists, but state is also available in details and via a non-color indicator, so this enhances rather than blocks other flows.

**Independent Test**: Load a Flows list containing both On and Off flows and confirm On rows are colored green and Off rows are colored red.

**Acceptance Scenarios**:

1. **Given** the Flows list contains an enabled (On) flow, **When** the list renders, **Then** that flow's row is colored green.
2. **Given** the Flows list contains a disabled (Off) flow, **When** the list renders, **Then** that flow's row is colored red.
3. **Given** a flow's state changes (e.g., after Turn On/Turn Off), **When** the list refreshes, **Then** the row color updates to match the new state.

---

### Edge Cases

- When grouped by Solution, the same flow appears under multiple solution groups — selecting it in one group must be reconciled so a bulk action does not double-apply to the same flow.
- What happens when a bulk Turn On/Turn Off, Change Owner, or Add To Solution is attempted on a managed flow that cannot be modified? The action is reported as failed for that flow without aborting the whole batch.
- How does the page avoid throttling when a bulk action spans many flows?
- What happens when Change Owner or Add To Solution is invoked but no target owner/solution is chosen? The action is not performed and the user is prompted to choose one.
- How is color-coding presented so it remains distinguishable for color-blind users and in both light and dark themes (i.e., color is not the only state indicator)?
- What happens when a bulk action is invoked with no flows selected? The action is unavailable or a no-op with a prompt to select flows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a single Flow is selected, the details form MUST show the flow's name, owner, the solutions the flow is part of, the connection references used by the flow, and the flow's state.
- **FR-002**: A flow with no solution membership or no connection references MUST show an explicit empty indication for those fields rather than a blank or error.
- **FR-003**: In the Flows list, each row MUST be color-coded by state: enabled (On) flows indicated in green and disabled (Off) flows indicated in red.
- **FR-004**: State MUST NOT be conveyed by color alone; a non-color indicator (e.g., a state label or icon) MUST also be present for accessibility, in both light and dark themes.
- **FR-005**: The filter/group/sort bar MUST offer grouping of the Flows list by Solution, State, or Owner.
- **FR-006**: When a first grouping is selected, the tool MUST present a "Then by" control that lets the user add a second grouping level and then a third.
- **FR-007**: Grouping MUST arrange flows into a forest of nested group nodes reflecting the selected grouping order (top-level trees with subtrees for each subsequent level).
- **FR-008**: The user MUST be able to select every flow within a group node (an entire tree or any subtree) with a single action.
- **FR-009**: When grouped by Solution, a flow that belongs to multiple solutions MUST appear once under each solution it belongs to.
- **FR-010**: When the same flow appears under multiple groups and is included in a selection more than once, a bulk action MUST apply to that flow only once.
- **FR-011**: The filter/group/sort bar MUST offer filtering of the Flows list by State.
- **FR-012**: The filter/group/sort bar MUST offer filtering of the Flows list by managed/unmanaged status.
- **FR-013**: Filters, search, and grouping MUST be combinable; the displayed flows MUST reflect all active constraints together.
- **FR-014**: For the Flows category, the toolbar MUST provide Turn On, Turn Off, Change Owner, and Add To Solution actions in addition to the common Refresh, Select All, and Clear Selection actions inherited from the base tool.
- **FR-015**: The Turn On and Turn Off actions MUST change the state of all currently selected flows to enabled or disabled respectively.
- **FR-016**: The Change Owner action MUST let the user choose a target owner and reassign all currently selected flows to that owner.
- **FR-017**: The Add To Solution action MUST let the user choose a target solution and add all currently selected flows to that solution.
- **FR-018**: Bulk flow actions MUST operate on the full current selection, including flows selected via group-node (tree/subtree) selection.
- **FR-019**: Bulk flow actions MUST report per-flow success and failure and MUST refresh affected rows so state, owner, and solution membership reflect the result.
- **FR-020**: A bulk flow action MUST NOT abort the entire batch when it fails for an individual flow (e.g., a managed flow that cannot be modified); it MUST continue and report the failure for that flow.
- **FR-021**: Change Owner and Add To Solution MUST source their selectable targets (owners, solutions) from the connected environment.

### Key Entities *(include if feature involves data)*

- **Flow**: A Power Automate cloud flow. Identifying attributes include a display name and state (On/enabled or Off/disabled); detail attributes include owner, the solutions the flow is part of, the connection references the flow uses, and managed/unmanaged status.
- **Solution**: A Power Platform solution a flow can belong to. Used as a flow detail, a grouping attribute, and the target of the Add To Solution action. A flow may belong to more than one solution.
- **Owner**: The user or principal that owns a flow. Used as a flow detail, a grouping attribute, and the target of the Change Owner action.
- **Connection Reference**: A connection reference used by a flow, shown as a flow dependency in the details form.
- **Group Node**: A node in the grouping forest representing a group (or nested subgroup) of flows; selectable to select all flows contained within it.
- **Selection**: The set of flows currently highlighted, including flows selected via group-node selection; de-duplicated so a flow appearing in multiple groups is acted upon once.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Selecting a single flow displays a details form populated with name, owner, solutions, connection references used, and state.
- **SC-002**: 100% of rows in the Flows list convey state via both color (green On / red Off) and a non-color indicator.
- **SC-003**: After grouping by Solution then State, a user can select all Off flows within a specific solution with a single action.
- **SC-004**: A user can apply Turn On, Turn Off, Change Owner, or Add To Solution to a multi-selected set of flows in a single action and receive per-flow success/failure feedback.
- **SC-005**: A flow belonging to multiple solutions is counted and acted upon only once, even when it appears under several solution groups in a selection.
- **SC-006**: Applying State and/or managed filters (optionally combined with search) reduces the visible flows to exactly those matching all active constraints.
- **SC-007**: A bulk action across many flows completes without freezing the interface and reports the outcome for every targeted flow.

## Assumptions

- This feature builds on the base tool shell defined in feature `001-power-automate-manager` (navigation, per-category list, right details panel, CTRL/SHIFT multi-select, common toolbar actions, and the filter/group/sort bar with search). Those base behaviors are not redefined here.
- All flow-specific capabilities in this feature (detail fields, state color-coding, grouping, State/managed filters, and the Turn On / Turn Off / Change Owner / Add To Solution actions) apply to the **Flows** category only.
- Explicit sort controls in the filter/group/sort bar remain a future addition; this feature covers grouping and filtering but not sorting.
- Bulk actions are limited to Turn On, Turn Off, Change Owner, and Add To Solution; other bulk operations such as delete are out of scope for this feature.
- Change Owner and Add To Solution present a picker for the target owner/solution; the set of assignable owners and solutions comes from the connected environment.
- The details panel is read-oriented; flow attributes are changed through the toolbar actions rather than by editing the form directly.
- Flow data (state, owner, solution membership, connection references, managed status) is retrieved through the sanctioned host/Dataverse/Power Platform APIs, using server-side filtering and paging where environment size warrants it (per the project constitution).
