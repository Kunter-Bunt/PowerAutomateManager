# Feature Specification: Connection References Page

**Feature Branch**: `003-connection-references-page`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Next up is a new feature for Connection References. Details page shows name, Connection, solutions and flows using it. grouping options are by solution and connector. same subtree logic for selection etc as with the flows. Filters only have managed/unmanaged. Toolbar has buttons for Change Connection, Add To Solution and Merge. Merge then requires to select a master connection. Merging can only work if all connection references use the same connector."

**Depends on**: Feature `001-power-automate-manager` (base tool shell — left navigation, per-category list, right details panel, CTRL/SHIFT multi-select, common toolbar actions, and the filter/group/sort bar with search). This feature specializes the **Connection References** category of that shell. It mirrors the grouping/selection interaction model defined for the Flows category in feature `002-flows-page`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect connection reference details (Priority: P1)

When a single Connection Reference is selected, the right-hand details form shows its name, the Connection it points to, the solutions it is part of, and the flows that use it.

**Why this priority**: Understanding what a connection reference points to, where it lives, and what depends on it is essential before repointing, adding to a solution, or merging.

**Independent Test**: Select individual connection references and confirm the details form shows name, the associated Connection, the solutions it belongs to, and the flows using it.

**Acceptance Scenarios**:

1. **Given** the Connection References list is shown, **When** the user selects a single connection reference, **Then** the details form shows its name, its Connection, the solutions it belongs to, and the flows using it.
2. **Given** a connection reference used by multiple flows, **When** its details are shown, **Then** all flows using it are listed.
3. **Given** a connection reference that belongs to multiple solutions, **When** its details are shown, **Then** all solutions it is part of are listed.
4. **Given** a connection reference with no Connection assigned or no flows using it, **When** its details are shown, **Then** those fields show an explicit empty indication rather than being blank or erroring.

---

### User Story 2 - Merge connection references (Priority: P1)

The user selects several connection references and invokes Merge. Merge requires the user to choose a master connection, and it is only permitted when all selected connection references use the same connector. On success, the selected connection references are consolidated onto the chosen master connection.

**Why this priority**: Merging duplicate connection references onto a single connection is a key clean-up capability unique to this page and the primary reason multi-select matters here.

**Independent Test**: Select multiple connection references that share a connector, invoke Merge, choose a master connection, and confirm they are consolidated onto it; then attempt Merge across differing connectors and confirm it is blocked with an explanatory message.

**Acceptance Scenarios**:

1. **Given** multiple connection references that all use the same connector are selected, **When** the user invokes Merge, **Then** the user is prompted to choose a master connection.
2. **Given** a master connection is chosen, **When** the merge completes, **Then** the selected connection references are consolidated onto that master connection.
3. **Given** selected connection references use more than one connector, **When** the user invokes Merge, **Then** the action is blocked and the user is told all selected references must use the same connector.
4. **Given** a merge partially fails, **When** it completes, **Then** the user is shown which references succeeded and which failed.

---

### User Story 3 - Change connection and add to solution (Priority: P1)

The toolbar provides Change Connection and Add To Solution actions that operate on the currently selected connection references (including references selected via group-node selection).

**Why this priority**: Repointing references to a different connection and adding them to a solution are core management actions alongside Merge.

**Independent Test**: Select several connection references, invoke Change Connection and choose a target connection, and confirm they are repointed; invoke Add To Solution and choose a solution, and confirm they are added.

**Acceptance Scenarios**:

1. **Given** one or more connection references are selected, **When** the user clicks Change Connection and chooses a target connection, **Then** the selected references are repointed to that connection.
2. **Given** one or more connection references are selected, **When** the user clicks Add To Solution and chooses a solution, **Then** the selected references are added to that solution.
3. **Given** a bulk action partially fails, **When** it completes, **Then** the user is shown which references succeeded and which failed.

---

### User Story 4 - Group connection references into a selectable forest (Priority: P2)

The user groups the Connection References list by Solution or Connector. After choosing a first grouping, a "Then by" control appears to add a second grouping level. Grouping arranges references into a forest of expandable group nodes, and selecting a group node selects every reference within that tree or subtree in one action — the same subtree selection model as the Flows page.

**Why this priority**: Grouping plus tree/subtree selection makes the bulk actions (especially Merge within a connector) efficient, but per-object selection still works without it.

**Independent Test**: Group by Connector, then by Solution; select a connector's subtree node and confirm all references using that connector become selected in one action.

**Acceptance Scenarios**:

1. **Given** the Connection References list, **When** the user selects a grouping of Solution or Connector, **Then** the list is reorganized into groups by that attribute.
2. **Given** a first grouping is selected, **When** the user opens "Then by", **Then** they can add a second grouping level.
3. **Given** a multi-level grouping, **When** the list renders, **Then** references are shown as a forest of nested group nodes reflecting the grouping order.
4. **Given** a group node (tree or subtree), **When** the user selects that node, **Then** all references contained within it are selected in a single action.
5. **Given** grouping by Solution, **When** a connection reference belongs to multiple solutions, **Then** it appears once under each solution it belongs to.

---

### User Story 5 - Filter connection references by managed status (Priority: P2)

The filter/group/sort bar lets the user narrow the Connection References list by managed/unmanaged status.

**Why this priority**: Filtering by management type complements search and grouping to isolate the relevant references before acting, but the page remains usable without it.

**Independent Test**: Apply a managed/unmanaged filter and confirm only references of that management type remain; clear it and confirm the full list returns.

**Acceptance Scenarios**:

1. **Given** the Connection References list, **When** the user applies a managed/unmanaged filter, **Then** only references of the selected management type are shown.
2. **Given** an active filter, **When** the user clears the filter, **Then** the full list is restored.
3. **Given** an active filter combined with a search term, **When** results are computed, **Then** only references matching both the filter and the search are shown.

---

### Edge Cases

- When grouped by Solution, the same connection reference appears under multiple solution groups — selecting it in one group must be reconciled so a bulk action does not double-apply to the same reference.
- What happens when Merge is invoked with references spanning multiple connectors? The action is blocked with a clear explanation.
- What happens when Merge, Change Connection, or Add To Solution is invoked but no master connection / target connection / target solution is chosen? The action is not performed and the user is prompted to choose one.
- What happens when a bulk action is attempted on a managed connection reference that cannot be modified? The action is reported as failed for that reference without aborting the whole batch.
- What happens when a bulk action is invoked with no references selected? The action is unavailable or a no-op with a prompt to select references.
- How does the page avoid throttling when a bulk action or merge spans many references?
- What is offered as the master connection choice — only connections matching the shared connector of the selected references?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a single Connection Reference is selected, the details form MUST show its name, the Connection it points to, the solutions it is part of, and the flows using it.
- **FR-002**: A connection reference with no assigned Connection, no solution membership, or no flows using it MUST show an explicit empty indication for those fields rather than a blank or error.
- **FR-003**: The filter/group/sort bar MUST offer grouping of the Connection References list by Solution or Connector.
- **FR-004**: When a first grouping is selected, the tool MUST present a "Then by" control that lets the user add a second grouping level.
- **FR-005**: Grouping MUST arrange connection references into a forest of nested group nodes reflecting the selected grouping order, using the same tree/subtree structure as the Flows page.
- **FR-006**: The user MUST be able to select every connection reference within a group node (an entire tree or any subtree) with a single action.
- **FR-007**: When grouped by Solution, a connection reference that belongs to multiple solutions MUST appear once under each solution it belongs to.
- **FR-008**: When the same connection reference appears under multiple groups and is included in a selection more than once, a bulk action MUST apply to that reference only once.
- **FR-009**: The filter/group/sort bar MUST offer filtering of the Connection References list by managed/unmanaged status.
- **FR-010**: Filters, search, and grouping MUST be combinable; the displayed connection references MUST reflect all active constraints together.
- **FR-011**: For the Connection References category, the toolbar MUST provide Change Connection, Add To Solution, and Merge actions in addition to the common Refresh, Select All, and Clear Selection actions inherited from the base tool.
- **FR-012**: The Change Connection action MUST let the user choose a target connection and repoint all currently selected connection references to that connection.
- **FR-013**: The Add To Solution action MUST let the user choose a target solution and add all currently selected connection references to that solution.
- **FR-014**: The Merge action MUST require the user to choose a master connection before the merge is performed.
- **FR-015**: The Merge action MUST be permitted only when all selected connection references use the same connector; otherwise it MUST be blocked with a message stating that all selected references must use the same connector.
- **FR-016**: When a valid merge is confirmed, the selected connection references MUST be consolidated onto the chosen master connection.
- **FR-017**: The master connection choice for Merge (and the target connection choice for Change Connection) MUST be limited to connections matching the relevant connector, sourced from the connected environment.
- **FR-018**: Bulk actions (Change Connection, Add To Solution, Merge) MUST operate on the full current selection, including references selected via group-node (tree/subtree) selection.
- **FR-019**: Bulk actions MUST report per-reference success and failure and MUST refresh affected rows so Connection and solution membership reflect the result.
- **FR-020**: A bulk action MUST NOT abort the entire batch when it fails for an individual reference (e.g., a managed reference that cannot be modified); it MUST continue and report the failure for that reference.

### Key Entities *(include if feature involves data)*

- **Connection Reference**: A Power Automate connection reference binding flows to a connector via a connection. Identifying attributes include a display name and connector; detail attributes include the Connection it points to, the solutions it is part of, the flows using it, and managed/unmanaged status.
- **Connection**: A Power Automate connection for a specific connector; a connection reference points to one connection, and Change Connection / Merge choose a target ("master") connection.
- **Connector**: The connector type shared by a connection and its references; used as a grouping attribute and as the constraint that gates Merge (all selected references must share one connector).
- **Solution**: A Power Platform solution a connection reference can belong to. Used as a detail, a grouping attribute, and the target of the Add To Solution action. A reference may belong to more than one solution.
- **Flow**: A Power Automate flow that uses a connection reference; shown as a dependency in the details form.
- **Group Node**: A node in the grouping forest representing a group (or nested subgroup) of connection references; selectable to select all references contained within it.
- **Selection**: The set of connection references currently highlighted, including those selected via group-node selection; de-duplicated so a reference appearing in multiple groups is acted upon once.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Selecting a single connection reference displays a details form populated with name, Connection, solutions, and flows using it.
- **SC-002**: After grouping by Connector, a user can select all references using a given connector with a single action.
- **SC-003**: A user can merge multiple same-connector connection references onto a chosen master connection in a single action and receive per-reference success/failure feedback.
- **SC-004**: Attempting to merge references that span more than one connector is prevented 100% of the time with a clear explanation.
- **SC-005**: A user can apply Change Connection or Add To Solution to a multi-selected set of references in a single action and receive per-reference success/failure feedback.
- **SC-006**: A connection reference belonging to multiple solutions is counted and acted upon only once, even when it appears under several solution groups in a selection.
- **SC-007**: Applying a managed/unmanaged filter (optionally combined with search) reduces the visible references to exactly those matching all active constraints.

## Assumptions

- This feature builds on the base tool shell defined in feature `001-power-automate-manager` and reuses the grouping/subtree selection interaction model defined for the Flows category in feature `002-flows-page`; those behaviors are not redefined here.
- All capabilities in this feature apply to the **Connection References** category only.
- The filter/group/sort bar for this category offers only a managed/unmanaged filter (no State filter, as connection references do not have an on/off state).
- Explicit sort controls remain a future addition; this feature covers grouping and filtering but not sorting.
- Bulk actions are limited to Change Connection, Add To Solution, and Merge; other bulk operations such as delete are out of scope for this feature.
- Merge consolidates the selected connection references onto a single chosen master connection; the connector constraint exists because a connection is specific to one connector.
- Change Connection and Merge present a picker of connections filtered to the relevant connector; Add To Solution presents a picker of solutions; all choices come from the connected environment.
- The details panel is read-oriented; reference attributes are changed through the toolbar actions rather than by editing the form directly.
- Connection reference data (Connection, connector, solution membership, flows using it, managed status) is retrieved through the sanctioned host/Dataverse/Power Platform APIs, using server-side filtering and paging where environment size warrants it (per the project constitution).
