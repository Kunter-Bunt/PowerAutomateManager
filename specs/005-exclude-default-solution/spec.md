# Feature Specification: Exclude Default Solution from Groupings and Listings

**Feature Branch**: `005-exclude-default-solution`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "We want to exclude the \"Default\" Solution (take the name, not the display name, as it will change depending on language selected) in groupings and when listing in which solutions an object is present. However, in grouping it might now occur that an object is in no solution other than the Default, therefore there might be a Group \"None\", that should be displayed at the very end of the list."

**Depends on / affects**: Features `002-flows-page` and `003-connection-references-page` (both group by Solution and list an object's solutions in the details form). This feature refines that behavior; it does not change the shell (`001`) or the Connections category (`004`, which has no solution grouping).

## Clarifications

### Session 2026-07-24

- Q: Which solution(s) should count as "Default" and be excluded? → A: Only the solution whose unique name is `Default` (not `Active` or other system solutions).
- Q: Should the Default solution also be hidden from the "Add To Solution" target picker? → A: No — exclusion applies to solution groupings and the details "Solutions" list only; the Add To Solution picker is unchanged.
- Q: What label should the terminal (no-remaining-solution) group use? → A: "None".
- Q: When Solution is a secondary/tertiary grouping level, should the "None" group still sort last within each parent group? → A: Yes — the "None" solution group sorts last at every level where Solution grouping applies.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hide the Default solution everywhere solutions are shown (Priority: P1)

When the user groups Flows or Connection References by Solution, or views the "Solutions" list in an object's details, the Default solution is never shown. The Default solution is identified by its **unique name** (language-independent), not its display name (which changes with the user's language).

**Why this priority**: Nearly every object belongs to the Default solution, so it adds noise to every solution grouping and every details view. Removing it is the core value of this feature.

**Independent Test**: Group Flows by Solution and confirm no group represents the Default solution; open a flow that is in Default plus one other solution and confirm the details "Solutions" list shows only the other solution.

**Acceptance Scenarios**:

1. **Given** the Flows list grouped by Solution, **When** the groups render, **Then** no group corresponds to the Default solution (matched by unique name).
2. **Given** the Connection References list grouped by Solution, **When** the groups render, **Then** no group corresponds to the Default solution.
3. **Given** a flow that belongs to the Default solution and one other solution, **When** its details are shown, **Then** the "Solutions" list shows only the other solution.
4. **Given** the user's language changes the Default solution's display name, **When** exclusion is applied, **Then** the Default solution is still excluded because matching is by unique name.

---

### User Story 2 - Show objects with no remaining solution in a "None" group ordered last (Priority: P2)

After the Default solution is excluded, an object may belong to no other solution. When grouping by Solution, such objects appear in a single "None" group, and that group is always displayed at the very end of the group list (after all named solution groups).

**Why this priority**: Excluding Default creates a new "no solution" case that must remain visible and predictably placed, but it is a refinement of the primary exclusion behavior.

**Independent Test**: Group Flows by Solution in an environment where some flows are only in the Default solution; confirm those flows appear under a single "None" group rendered after all other solution groups.

**Acceptance Scenarios**:

1. **Given** an object whose only solution is the Default solution, **When** grouping by Solution, **Then** the object appears in the "None" group.
2. **Given** an object in no solution at all, **When** grouping by Solution, **Then** the object also appears in the "None" group.
3. **Given** groups by Solution including a "None" group, **When** the list renders, **Then** the "None" group is positioned after every named solution group (last), regardless of alphabetical order.
4. **Given** every object belongs to at least one non-Default solution, **When** grouping by Solution, **Then** no "None" group is shown.

---

### Edge Cases

- What happens when the Default solution cannot be identified (e.g., unique name not present in the loaded data)? The tool shows all solutions unchanged rather than erroring.
- When grouping by Solution then by another level (e.g., State), the "None" top-level group still sorts last while its subgroups sort normally.
- Does excluding Default change selection or bulk actions? No — it only affects which solution groups/labels are displayed; the underlying objects and their membership in other solutions are unchanged.
- If an object is in Default only and is selected via the "None" group, bulk actions still operate on the object normally.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST identify the Default solution by its unique name (language-independent) — specifically the solution whose unique name is `Default` — not its display/friendly name. Only this solution is excluded (not `Active` or other system solutions).
- **FR-002**: When grouping Flows or Connection References by Solution, the tool MUST NOT create a group for the Default solution.
- **FR-003**: In an object's details "Solutions" list, the tool MUST NOT include the Default solution.
- **FR-004**: Excluding the Default solution MUST NOT remove the object itself from any list; only the Default solution's group/label is suppressed.
- **FR-005**: When grouping by Solution, an object left with no non-Default solution MUST be placed in a single "None" group.
- **FR-006**: An object that belongs to no solution at all MUST also be placed in the same "None" group.
- **FR-007**: The "None" group MUST always be ordered last, after all named solution groups, regardless of alphabetical sorting. This MUST apply at every level where Solution grouping is used — both as the top-level grouping and as a nested "Then by" level: within each parent group, the "None" solution subgroup sorts after all named solution subgroups.
- **FR-008**: If no object falls into the "None" case, the tool MUST NOT display a "None" group.
- **FR-009**: If the Default solution cannot be identified in the loaded data, the tool MUST leave solution groupings and listings unchanged (no exclusion, no error).
- **FR-010**: The exclusion MUST apply consistently to both the Flows and Connection References categories.
- **FR-011**: The "Add To Solution" target picker MUST remain unchanged by this feature — the Default solution stays selectable there. Exclusion applies only to solution groupings and the details "Solutions" list.
- **FR-012**: The terminal group's label MUST be "None".

### Key Entities *(include if feature involves data)*

- **Default Solution**: The environment's default solution, identified by a fixed unique name that does not vary by language. Excluded from solution groupings and details listings.
- **Solution grouping**: The set of solution-based groups shown for a category, now excluding the Default solution and optionally including a trailing "None" group.
- **"None" group**: A single terminal group collecting objects with no non-Default solution membership; always ordered last.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of solution groupings (Flows and Connection References), no group represents the Default solution.
- **SC-002**: In 100% of object details, the "Solutions" list omits the Default solution.
- **SC-003**: Default-solution exclusion holds regardless of the UI/display language (verified by matching on unique name).
- **SC-004**: When present, the "None" group appears as the last group 100% of the time.
- **SC-005**: No object disappears from any list as a result of excluding the Default solution.

## Assumptions

- The Default solution is the one whose unique name is `Default` (a stable, language-independent value); only this solution is excluded (not `Active` or other system solutions). The exact value is confirmed against the environment during implementation.
- Only solution-based groupings and the details "Solutions" list are affected; State/Owner/Connector groupings and all other behaviors are unchanged.
- The Connections category (`004`) is unaffected because it has no solution grouping or solution details list.
- The terminal group is labeled "None" (replacing the prior "No solution" wording for the Solution grouping); its ordering must be last per FR-007.
- Add To Solution and other bulk actions continue to operate on the actual objects; excluding Default is purely presentational, and the Add To Solution target picker is unchanged (Default remains selectable) per FR-011.
