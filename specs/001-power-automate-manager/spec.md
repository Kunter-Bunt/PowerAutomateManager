# Feature Specification: Power Automate Manager

**Feature Branch**: `001-power-automate-manager`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Build a PowerPlatformToolbox tool. The Power Automate Manager lets the user interact with the object of Microsoft Power Automate. The tool shall have a navigation bar on the left where Users can select between Flows, Connection References and Connections. The main window shall show a list of objects (depending on the navigation item selected) and when an object is selected, the right shows a form of additional details. Multiselect has to be possible for all lists with CTRL and Shift. The top has a row of tools. For all objects this contains buttons for refresh, select all and clear selection. Below the toolbar is a filter/group/sort bar. for now we only want a search box in there."

**Scope note**: This feature covers the **overall tool shell** shared by all categories. Flows-category specializations (flow detail fields, state color-coding, grouping, State/managed filters, and the Turn On / Turn Off / Change Owner / Add To Solution bulk actions) are specified separately in feature `002-flows-page`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Power Automate objects by category (Priority: P1)

An administrator opens the Power Automate Manager and uses the left navigation bar to switch between Flows, Connection References, and Connections. Selecting a navigation item loads the corresponding list of objects from the connected environment into the main list area.

**Why this priority**: Without the ability to load and view the objects, no other feature has value. This is the foundational MVP that turns the tool into something usable.

**Independent Test**: Connect to an environment, click each navigation item in turn, and confirm the main area shows the correct category of objects with meaningful identifying information for each row.

**Acceptance Scenarios**:

1. **Given** the tool is open with an active connection, **When** the user selects "Flows" in the navigation bar, **Then** the main area displays a list of Power Automate Flows from the environment.
2. **Given** the user is viewing Flows, **When** the user selects "Connection References", **Then** the main area replaces the Flow list with the list of Connection References.
3. **Given** the user is viewing any category, **When** the user selects "Connections", **Then** the main area displays the list of Connections.
4. **Given** a category has no objects in the environment, **When** the user selects it, **Then** the main area shows an empty-state message rather than an error.

---

### User Story 2 - Inspect object details (Priority: P1)

When the user selects a single object in the list, a details form appears on the right side showing additional attributes for that specific object (Flow, Connection Reference, or Connection).

**Why this priority**: Viewing details is the core purpose of a management tool; browsing a list alone is not sufficient to understand or act on an object.

**Independent Test**: Select one object in each category and confirm the right-hand form populates with details relevant to that object type and clears/updates when a different object is selected.

**Acceptance Scenarios**:

1. **Given** a list of objects is shown, **When** the user selects a single object, **Then** the right-hand panel shows a details form for that object.
2. **Given** a details form is shown for one object, **When** the user selects a different single object, **Then** the details form updates to reflect the newly selected object.
3. **Given** the details form is showing an object, **When** the user clears the selection, **Then** the details form shows a neutral empty state.
4. **Given** more than one object is selected, **When** the user views the right-hand panel, **Then** the panel indicates that a single object must be selected to show details (or shows details for the primary selection).

---

### User Story 3 - Select multiple objects (Priority: P2)

The user selects multiple objects in any list using standard multi-select gestures: CTRL+click to toggle individual objects and SHIFT+click to select a contiguous range.

**Why this priority**: Multi-select is required for future bulk actions and is expected behavior in a management surface, but the tool is still usable for inspection without it.

**Independent Test**: In each list, CTRL+click several non-adjacent rows and confirm each toggles independently; SHIFT+click a start and end row and confirm the full range is selected.

**Acceptance Scenarios**:

1. **Given** a list of objects, **When** the user CTRL+clicks multiple rows, **Then** each clicked row is added to or removed from the selection independently.
2. **Given** a row is selected, **When** the user SHIFT+clicks another row, **Then** all rows between the two are selected as a contiguous range.
3. **Given** multiple rows are selected, **When** the user plain-clicks a single row, **Then** the selection collapses to only that row.
4. **Given** multi-select behavior, **When** the user switches to a different navigation category, **Then** the selection from the previous category does not carry over.

---

### User Story 4 - Toolbar actions (Priority: P2)

A toolbar at the top of the tool provides Refresh, Select All, and Clear Selection actions that apply to the currently displayed list regardless of category.

**Why this priority**: These actions make working with lists efficient (reloading data, selecting everything for a future bulk action, deselecting), but the core browse/inspect flows work without them.

**Independent Test**: For each category, click Refresh and confirm the list reloads; click Select All and confirm every visible object is selected; click Clear Selection and confirm nothing remains selected.

**Acceptance Scenarios**:

1. **Given** any category is displayed, **When** the user clicks Refresh, **Then** the list reloads current data from the environment.
2. **Given** a list with objects, **When** the user clicks Select All, **Then** all objects currently shown in the list are selected.
3. **Given** one or more objects are selected, **When** the user clicks Clear Selection, **Then** no objects remain selected.
4. **Given** the toolbar, **When** the user switches categories, **Then** the same three actions remain available and operate on the new list.

---

### User Story 5 - Search within a list (Priority: P3)

Below the toolbar, a filter/group/sort bar provides a search box that narrows the currently displayed list to objects matching the entered text.

**Why this priority**: Search improves usability in large environments but is an enhancement over the core browse and inspect flows. The bar is scoped to only a search box for now, leaving room for future group/sort controls.

**Independent Test**: With a populated list, type text into the search box and confirm the list narrows to matching objects; clear the text and confirm the full list returns.

**Acceptance Scenarios**:

1. **Given** a populated list, **When** the user types text into the search box, **Then** the list narrows to objects whose displayed identifying text matches the entered text.
2. **Given** an active search term, **When** the user clears the search box, **Then** the full list is restored.
3. **Given** an active search term, **When** the user switches navigation categories, **Then** the search box resets for the new category.
4. **Given** a search term that matches nothing, **When** results are computed, **Then** an empty-state message is shown rather than an error.

---

### Edge Cases

- What happens when the environment connection is unavailable or the data request fails? The tool shows a clear, non-blocking error state and offers a way to retry (e.g., Refresh) rather than a blank screen.
- How does the tool handle a very large number of objects (hundreds or more) without freezing the interface?
- What happens to an active selection when Refresh removes objects that were previously selected? The selection is reconciled to only objects that still exist.
- How does search interact with multi-select — does selecting all select only the filtered results or every object? (See FR-016.)
- What is shown in the details panel when zero objects, one object, or multiple objects are selected?
- How does the tool behave before any navigation item is chosen (initial state)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST present a left-hand navigation bar with three selectable items: Flows, Connection References, and Connections.
- **FR-002**: The tool MUST display, in the main area, a list of objects for the category selected in the navigation bar.
- **FR-003**: Switching navigation categories MUST replace the main-area list with the objects of the newly selected category.
- **FR-004**: Each list row MUST show enough identifying information for the user to distinguish objects of that category (e.g., a name and one or more descriptive attributes).
- **FR-005**: The tool MUST show an empty-state message when the selected category contains no objects, distinct from an error state.
- **FR-006**: When exactly one object is selected, the tool MUST display a right-hand details form showing additional attributes for that object.
- **FR-007**: The details form MUST update when the selected object changes and MUST show a neutral empty state when no object is selected.
- **FR-008**: The details form MUST present fields appropriate to the object type (Flow, Connection Reference, or Connection).
- **FR-009**: All lists MUST support multi-selection using CTRL+click to toggle individual objects.
- **FR-010**: All lists MUST support multi-selection using SHIFT+click to select a contiguous range of objects.
- **FR-011**: A plain click on a row MUST collapse the selection to only that row.
- **FR-012**: Selection state MUST be reset when the user switches navigation categories.
- **FR-013**: The tool MUST provide a top toolbar, available for every category, containing Refresh, Select All, and Clear Selection actions.
- **FR-014**: The Refresh action MUST reload the current category's data from the environment.
- **FR-015**: The Select All action MUST select all objects currently shown in the active list.
- **FR-016**: When a search term is active, Select All MUST select only the objects currently visible (matching the search), not hidden objects.
- **FR-017**: The Clear Selection action MUST remove all objects from the current selection.
- **FR-018**: The tool MUST provide a filter/group/sort bar positioned below the toolbar and above the list.
- **FR-019**: The filter/group/sort bar MUST contain a search box (and, for this release, no other controls).
- **FR-020**: Entering text in the search box MUST narrow the current list to objects whose displayed identifying text matches the term.
- **FR-021**: Clearing the search box MUST restore the full list for the current category.
- **FR-022**: The search term MUST reset when the user switches navigation categories.
- **FR-023**: The tool MUST surface a clear, retryable error state when environment data cannot be loaded, without blocking the interface.
- **FR-024**: The interface MUST remain responsive while lists are loading or refreshing.

### Key Entities *(include if feature involves data)*

- **Flow**: A Power Automate cloud flow in the connected environment. Identifying attributes include a display name and state (e.g., enabled/disabled); detail attributes are specialized in feature `002-flows-page`.
- **Connection Reference**: A Power Automate connection reference that binds a flow to a connector. Identifying attributes include a display name and the associated connector; detail attributes include the linked connection and connector type as available.
- **Connection**: A Power Automate connection to an external or Microsoft service. Identifying attributes include a display name and connector; detail attributes include status and owner as available.
- **Selection**: The set of objects the user has currently highlighted in the active list; scoped to a single category and reset on category change.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can switch between all three categories and see the corresponding list without leaving the tool or reloading it.
- **SC-002**: A user can locate a specific object and open its details form in under 10 seconds in an environment with hundreds of objects, using search.
- **SC-003**: 100% of the lists (Flows, Connection References, Connections) support CTRL and SHIFT multi-select and the three toolbar actions.
- **SC-004**: Selecting a single object displays a populated details form for every supported object type.
- **SC-005**: The interface remains interactive (no frozen UI) while loading or refreshing a list of hundreds of objects.
- **SC-006**: When data loading fails, 100% of failures present a retryable error state rather than a blank or frozen screen.
- **SC-007**: Applying a search term reduces the visible list to only matching objects, and clearing it restores the full list, with no page reload.

## Assumptions

- The tool runs as a Power Platform ToolBox (PPTB) tool and obtains its environment connection from the host; it does not manage its own authentication (per the project constitution).
- Object data (Flows, Connection References, Connections) is retrieved through the sanctioned host/Dataverse/Power Platform APIs, using server-side filtering and paging where the environment size warrants it.
- "Search" matches against the displayed identifying text of each object (such as its display name); advanced field-scoped or query-syntax search is out of scope for this release.
- The filter/group/sort bar is intentionally limited to a search box at the shell level; category-specific grouping, filtering, and sorting controls are defined per category (see feature `002-flows-page` for the Flows category), and the bar is designed to accommodate them.
- Category-specific bulk actions and specialized detail fields are defined in their own features (e.g., feature `002-flows-page` covers the Flows category); at the shell level, multi-select establishes the foundation those features build on.
- The details panel is read-oriented at the shell level; category features may add attribute-changing actions via their toolbars.
- Standard desktop interaction (mouse with CTRL/SHIFT modifiers) is assumed; touch-specific multi-select gestures are out of scope.
