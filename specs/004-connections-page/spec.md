# Feature Specification: Connections Page

**Feature Branch**: `004-connections-page`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Next up is a new feature for Connections. Details page show name, Owner and Flows using it. Grouping Options are by Owner and Connector. There are no filters other than the universal search box. Toolbox has buttons for Share where other Users, Teams and S2S Apps can be selected."

**Depends on**: Feature `001-power-automate-manager` (base tool shell — left navigation, per-category list, right details panel, CTRL/SHIFT multi-select, common toolbar actions, and the filter/group/sort bar with search). This feature specializes the **Connections** category of that shell and reuses the grouping/subtree selection interaction model defined for the Flows category in feature `002-flows-page`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Inspect connection details (Priority: P1)

When a single Connection is selected, the right-hand details form shows its name, its owner, and the flows that use it.

**Why this priority**: Knowing who owns a connection and which flows depend on it is essential before sharing it or reasoning about its impact.

**Independent Test**: Select individual connections and confirm the details form shows name, owner, and the flows using each connection.

**Acceptance Scenarios**:

1. **Given** the Connections list is shown, **When** the user selects a single connection, **Then** the details form shows its name, owner, and the flows using it.
2. **Given** a connection used by multiple flows, **When** its details are shown, **Then** all flows using it are listed.
3. **Given** a connection with no flows using it, **When** its details are shown, **Then** the flows field shows an explicit empty indication rather than being blank or erroring.

---

### User Story 2 - Share connections (Priority: P1)

The toolbar provides a Share action. When invoked on the currently selected connections, the user can choose one or more Users, Teams, and S2S (server-to-server) Apps to share those connections with.

**Why this priority**: Sharing is the primary management action for connections, letting owners grant access to other principals; it is the main reason multi-select matters on this page.

**Independent Test**: Select one or more connections, invoke Share, choose a mix of Users, Teams, and S2S Apps, and confirm the selected connections are shared with each chosen target.

**Acceptance Scenarios**:

1. **Given** one or more connections are selected, **When** the user clicks Share, **Then** the user can select share targets from Users, Teams, and S2S Apps.
2. **Given** share targets are chosen, **When** the share is confirmed, **Then** the selected connections are shared with each chosen User, Team, and S2S App.
3. **Given** Share is invoked but no target is chosen, **When** the user confirms, **Then** no sharing is performed and the user is prompted to choose at least one target.
4. **Given** a share partially fails, **When** it completes, **Then** the user is shown which connections shared successfully and which failed.

---

### User Story 3 - Group connections into a selectable forest (Priority: P2)

The user groups the Connections list by Owner or Connector. After choosing a first grouping, a "Then by" control appears to add a second grouping level. Grouping arranges connections into a forest of expandable group nodes, and selecting a group node selects every connection within that tree or subtree in one action — the same subtree selection model as the Flows page.

**Why this priority**: Grouping plus tree/subtree selection makes sharing across many connections efficient (e.g., share all connections owned by one user), but per-object selection still works without it.

**Independent Test**: Group by Owner, then by Connector; select an owner's subtree node and confirm all connections owned by that user become selected in one action.

**Acceptance Scenarios**:

1. **Given** the Connections list, **When** the user selects a grouping of Owner or Connector, **Then** the list is reorganized into groups by that attribute.
2. **Given** a first grouping is selected, **When** the user opens "Then by", **Then** they can add a second grouping level.
3. **Given** a multi-level grouping, **When** the list renders, **Then** connections are shown as a forest of nested group nodes reflecting the grouping order.
4. **Given** a group node (tree or subtree), **When** the user selects that node, **Then** all connections contained within it are selected in a single action.

---

### Edge Cases

- What happens when Share is invoked with no connections selected? The action is unavailable or a no-op with a prompt to select connections.
- What happens when Share is invoked but no target (User, Team, or S2S App) is chosen? Nothing is shared and the user is prompted to choose at least one target.
- What happens when sharing a connection the current user does not own or cannot manage? The action is reported as failed for that connection without aborting the whole batch.
- How does the page avoid throttling when sharing spans many connections or many targets?
- How are the three target types (Users, Teams, S2S Apps) presented so the user can tell them apart when selecting?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a single Connection is selected, the details form MUST show its name, its owner, and the flows using it.
- **FR-002**: A connection with no flows using it MUST show an explicit empty indication for that field rather than a blank or error.
- **FR-003**: The filter/group/sort bar MUST offer grouping of the Connections list by Owner or Connector.
- **FR-004**: When a first grouping is selected, the tool MUST present a "Then by" control that lets the user add a second grouping level.
- **FR-005**: Grouping MUST arrange connections into a forest of nested group nodes reflecting the selected grouping order, using the same tree/subtree structure as the Flows page.
- **FR-006**: The user MUST be able to select every connection within a group node (an entire tree or any subtree) with a single action.
- **FR-007**: When the same connection appears in a selection more than once, a bulk action MUST apply to that connection only once.
- **FR-008**: For the Connections category, the filter/group/sort bar MUST contain only the universal search box; no additional filters are provided.
- **FR-009**: Search and grouping MUST be combinable; the displayed connections MUST reflect all active constraints together.
- **FR-010**: For the Connections category, the toolbar MUST provide a Share action in addition to the common Refresh, Select All, and Clear Selection actions inherited from the base tool.
- **FR-011**: The Share action MUST let the user select one or more share targets across Users, Teams, and S2S (server-to-server) Apps.
- **FR-012**: Confirming a share MUST grant each chosen target access to all currently selected connections.
- **FR-013**: The Share action MUST operate on the full current selection, including connections selected via group-node (tree/subtree) selection.
- **FR-014**: The Share action MUST report per-connection success and failure and MUST refresh affected rows where sharing changes their displayed state.
- **FR-015**: The Share action MUST NOT abort the entire batch when it fails for an individual connection (e.g., one the current user cannot manage); it MUST continue and report the failure for that connection.
- **FR-016**: The selectable share targets (Users, Teams, S2S Apps) MUST be sourced from the connected environment.

### Key Entities *(include if feature involves data)*

- **Connection**: A Power Automate connection to an external or Microsoft service. Identifying attributes include a display name and connector; detail attributes include the owner and the flows using it.
- **Owner**: The user or principal that owns a connection. Used as a detail and as a grouping attribute.
- **Connector**: The connector type of a connection; used as a grouping attribute.
- **Flow**: A Power Automate flow that uses a connection; shown as a dependency in the details form.
- **Share Target**: A principal a connection can be shared with — a User, a Team, or an S2S (server-to-server) App.
- **Group Node**: A node in the grouping forest representing a group (or nested subgroup) of connections; selectable to select all connections contained within it.
- **Selection**: The set of connections currently highlighted, including those selected via group-node selection; de-duplicated so a connection is acted upon once.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Selecting a single connection displays a details form populated with name, owner, and the flows using it.
- **SC-002**: After grouping by Owner, a user can select all connections owned by a given user with a single action.
- **SC-003**: A user can share a multi-selected set of connections with any mix of Users, Teams, and S2S Apps in a single action and receive per-connection success/failure feedback.
- **SC-004**: Sharing across many connections completes without freezing the interface and reports the outcome for every targeted connection.
- **SC-005**: The Connections filter/group/sort bar exposes only the universal search box and no additional filters.

## Assumptions

- This feature builds on the base tool shell defined in feature `001-power-automate-manager` and reuses the grouping/subtree selection interaction model defined for the Flows category in feature `002-flows-page`; those behaviors are not redefined here.
- All capabilities in this feature apply to the **Connections** category only.
- The Connections category intentionally has no category-specific filters (only the universal search box); connections do not have a State or managed/unmanaged filter in this feature.
- Explicit sort controls remain a future addition; this feature covers grouping but not sorting.
- Bulk actions are limited to Share; other bulk operations (e.g., delete, change owner) are out of scope for this feature.
- Share presents a picker of Users, Teams, and S2S Apps drawn from the connected environment; the exact permission level granted by sharing follows the platform's standard connection-sharing behavior.
- The details panel is read-oriented; sharing is performed through the toolbar action rather than by editing the form directly.
- Connection data (owner, connector, flows using it) is retrieved through the sanctioned host/Dataverse/Power Platform APIs, using server-side filtering and paging where environment size warrants it (per the project constitution).
