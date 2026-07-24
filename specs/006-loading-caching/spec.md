# Feature Specification: Non-Blocking Loading, Caching, and Per-Object Reload

**Feature Branch**: `006-loading-caching`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "We need some loading improvements. Loading the objects takes some time and should be accompanied by a well visible spinner. However that spinner shall not block other operations like selecting from the list. Sample: If I turn on one flow, this might take 10 seconds, we need a spinner, but the user shall be able to select the next flow already. Also caching is needed, if the object is switched in the navigation and back, it should not reload and let the user wait. And when an operation like turn on is taken to an object, only that object needs to be reloaded."

**Depends on / affects**: The shell (`001`) data-loading and toolbar-action flow, applied across all three categories (Flows `002`, Connection References `003`, Connections `004`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Non-blocking spinner while a list loads (Priority: P1)

While a category's object list is loading, the user sees a clearly visible spinner. The spinner communicates progress without freezing the interface — the user can still switch navigation categories and use other controls.

**Why this priority**: Loading can take noticeable time; a visible, non-blocking spinner is the baseline for a responsive feel.

**Independent Test**: Open a category with many objects and confirm a spinner shows during load, while the navigation bar and other controls remain responsive.

**Acceptance Scenarios**:

1. **Given** a category is loading, **When** the list has not yet arrived, **Then** a clearly visible spinner is shown in the list area.
2. **Given** a category is loading, **When** the user clicks a different navigation category, **Then** the tool switches without being blocked by the in-progress load.
3. **Given** a load completes, **When** the objects arrive, **Then** the spinner is replaced by the list.

---

### User Story 2 - Non-blocking object operations with a per-object spinner (Priority: P1)

When the user runs an operation on an object (e.g., Turn On), a spinner appears on that object while the operation is in progress (which may take several seconds), but the user can immediately continue selecting and working with other objects.

**Why this priority**: This is the core of the request — long operations must not lock the user out of the list.

**Independent Test**: Turn On a flow that takes several seconds; confirm a spinner shows on that flow while the user selects and inspects a different flow with no delay.

**Acceptance Scenarios**:

1. **Given** an operation is started on an object, **When** it is in progress, **Then** a visible busy/spinner indicator is shown on that object.
2. **Given** an operation is in progress on one object, **When** the user selects another object, **Then** the selection succeeds immediately without waiting for the operation to finish.
3. **Given** an operation is in progress on an object, **When** the user attempts to start another operation on that same object, **Then** the tool does not start a second concurrent operation on it until the first completes.
4. **Given** an operation completes (success or failure), **When** it finishes, **Then** the object's busy indicator clears and the outcome is reported per object.

---

### User Story 3 - Cache categories so switching back is instant (Priority: P2)

Once a category has been loaded, switching to another category and back shows the previously loaded list immediately, without a reload or a wait. Explicitly refreshing, or changing the connection, gets fresh data.

**Why this priority**: Re-loading on every navigation switch is a common, avoidable wait; caching makes navigation feel instant.

**Independent Test**: Load Flows, switch to Connections, switch back to Flows, and confirm the Flows list appears immediately with no loading state.

**Acceptance Scenarios**:

1. **Given** a category was previously loaded, **When** the user navigates away and back, **Then** its list appears immediately with no loading spinner and no reload.
2. **Given** a cached category, **When** the user clicks Refresh, **Then** the tool reloads fresh data for that category.
3. **Given** cached categories, **When** the active connection changes, **Then** all cached data is discarded and categories reload on next view.

---

### User Story 4 - Reload only the affected object after an operation (Priority: P2)

After an operation completes on an object, only that object's data is refreshed — the rest of the list is not reloaded, so there is no full-list wait and the user's context is preserved.

**Why this priority**: Full-list reloads after every operation are slow and disruptive; refreshing just the changed object keeps the UI stable and fast.

**Independent Test**: Turn Off a flow and confirm its row updates (state/color) while the other rows and the current scroll/selection are undisturbed and not reloaded.

**Acceptance Scenarios**:

1. **Given** an operation completes on an object, **When** the tool refreshes, **Then** only that object's row is updated with its new data.
2. **Given** an operation on several selected objects, **When** it completes, **Then** only those objects are refreshed, not the whole list.
3. **Given** a per-object refresh fails, **When** it completes, **Then** the failure is surfaced for that object without discarding or reloading the rest of the list.

---

### Edge Cases

- What happens if the user switches category while an operation is still in progress on the previous category? The operation continues; when it completes, the affected object's cached data is updated so it is correct when the user returns.
- What happens if a cached object was deleted in the environment and later refreshed per-object? The object is removed from the list on its per-object refresh, without reloading the rest.
- What happens if Refresh is pressed while an operation is in progress? Refresh reloads the category; in-progress operations still complete and their results are reconciled.
- How is the busy indicator shown for objects selected via a group node (bulk operation)? Each affected object shows its own busy indicator.
- Does the spinner appear for instant cache hits? No — a cache hit shows the list immediately with no spinner.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST display a clearly visible loading spinner in the list area while a category's objects are loading.
- **FR-002**: The loading spinner MUST NOT block the rest of the interface; navigation between categories and other controls MUST remain usable during a load.
- **FR-003**: The tool MUST cache each category's loaded objects for the current session (per connection); returning to a previously loaded category MUST show the cached list immediately, with no reload and no loading spinner.
- **FR-004**: The Refresh action MUST force a fresh load of the current category, replacing its cached data.
- **FR-005**: Changing the active connection MUST discard all cached category data.
- **FR-006**: When an operation runs on one or more objects, the tool MUST show a visible per-object busy/spinner indicator on each affected object while the operation is in progress.
- **FR-007**: Object operations MUST NOT block the interface; the user MUST be able to change the selection and inspect other objects while an operation is in progress.
- **FR-008**: When an operation completes, the tool MUST refresh only the affected object(s), not the entire list.
- **FR-009**: An object with an in-progress operation MUST indicate its busy state and MUST NOT accept a second concurrent operation until the first completes.
- **FR-010**: Operation outcomes MUST be reported per object (success/failure), consistent with existing behavior, and surfaced without blocking the interface.
- **FR-011**: If a per-object refresh fails, the tool MUST surface that object's failure without discarding or reloading the rest of the list.
- **FR-012**: The loading spinner and per-object busy indicators MUST be theme-aware and consistent with the tool's styling.
- **FR-013**: Caching and per-object reload behavior MUST apply consistently across all three categories (Flows, Connection References, Connections).

### Key Entities *(include if feature involves data)*

- **Category cache**: The in-memory, session-scoped set of loaded objects for a category under the current connection; served instantly on return and invalidated on Refresh or connection change.
- **Operation (in-progress)**: A running action on one or more objects, each affected object carrying a busy state until completion; blocks a second concurrent operation on the same object.
- **Busy indicator**: The per-object spinner shown while that object has an in-progress operation or per-object refresh.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Returning to a previously loaded category shows its list immediately (no loading spinner, no reload) in effectively 100% of return visits within a session.
- **SC-002**: During a multi-second object operation, the interface never freezes and the user can select a different object with no perceptible delay.
- **SC-003**: After an operation on an object, only that object's row updates; other rows are not reloaded and the user's scroll/selection context is preserved.
- **SC-004**: A visible spinner appears promptly (within a fraction of a second) whenever a list load or an object operation is in progress.
- **SC-005**: After an explicit Refresh or a connection change, the tool never serves stale cached data.

## Assumptions

- The cache is in-memory and session-scoped, keyed per category and per connection; it is not persisted to disk.
- There is no time-based cache expiry; freshness is controlled by the Refresh action and connection changes.
- A per-object concurrency guard prevents overlapping operations on the same object; different objects can have operations in progress simultaneously.
- "Per-object reload" refreshes the affected object's list row data (e.g., state, owner); details shown on selection reflect current data when the object is reselected.
- Existing per-object success/failure reporting (batched actions) is retained; this feature changes when/how it is surfaced (non-blocking), not the underlying results.
- Applies to all three categories; categories that have no meaningful per-object change from an operation may skip the per-object data refetch while still clearing the busy indicator.
