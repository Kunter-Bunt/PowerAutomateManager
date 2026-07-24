# Research: Exclude Default Solution from Groupings and Listings

**Feature**: 005-exclude-default-solution | **Date**: 2026-07-24 | **Phase**: 0

Small refinement to features `002`/`003`; decisions below reflect the clarified requirements.

## Decision 1 — Exclude at the index source (single choke point)

**Decision**: Exclude the Default solution when building the per-object solution membership index (`loadSolutionMembership` for flows, `buildSolutionsByRef` for connection references) by skipping rows whose `sol.uniquename` equals `Default`. Both the Solution grouping and the details "Solutions" list read from these indices, so both inherit the exclusion from one place.

**Rationale**: Filtering once at the source guarantees consistency (FR-002, FR-003, FR-010) and keeps the grouping/detail code unchanged apart from labels. `uniquename` is already selected in these queries, so no extra data is fetched (Constitution III).

**Alternatives considered**: Filtering separately in grouping and in details — rejected (duplicated logic, risk of drift). Filtering in the FetchXML query — possible but harder to unit-test and less flexible than an in-memory `isDefaultSolution` check.

## Decision 2 — Match by unique name via a shared helper

**Decision**: Add `src/lib/solutions.ts` exporting `DEFAULT_SOLUTION_UNIQUE_NAME = 'Default'` and `isDefaultSolution(uniqueName: string): boolean`. Use it in both features.

**Rationale**: FR-001 requires language-independent matching by unique name; a shared constant avoids duplicated magic strings across two features (Constitution I). If no row has that unique name, nothing is excluded — this satisfies the safe-fallback requirement (FR-009) with no special-casing.

**Alternatives considered**: Matching on display/friendly name — rejected (changes with language, FR-001). Per-feature constants — rejected (duplication).

## Decision 3 — "None" group label and last-ordering

**Decision**: The empty-solution grouping key keeps its stable key (`__none__`) but its label becomes `None` (FR-012), and the `GroupKey` it produces is marked `sortLast: true`. The shell's `GroupKey`/`GroupNode` gain an optional `sortLast?: boolean`, and `buildForest` sorts nodes by `sortLast` first (false before true), then alphabetically. Because `buildForest` recurses, this orders "None" last at every level where Solution grouping is applied (FR-007).

**Rationale**: A backward-compatible flag is the smallest shell change that makes the "None" group deterministically last without hard-coding a key string into the generic builder. Marking it on the `GroupKey` keeps the ordering rule co-located with the grouping option that needs it.

**Alternatives considered**: Special-casing the `__none__` key string inside `buildForest` — rejected (couples the generic builder to a feature convention). A numeric `order` field — heavier than needed; a boolean suffices for "last".

## Decision 4 — Objects with only Default (or none) fall into "None"

**Decision**: After exclusion, an object's solution list may be empty; the Solution `keysFor` already returns the `__none__` key when the list is empty, so objects that were only in Default (or in no solution) naturally land in the single "None" group (FR-005, FR-006). No "None" group is produced when no object is empty (FR-008), because no item yields the key.

**Rationale**: Reuses existing empty-handling; excluding Default simply grows the empty set. Consistent for both features.

**Alternatives considered**: A separate "Default only" group — rejected; the spec calls for a single "None" group.

## Decision 5 — Add To Solution picker unchanged

**Decision**: Do not touch the Add To Solution target picker; Default remains selectable there (FR-011). Exclusion is confined to solution groupings and the details "Solutions" list.

**Rationale**: Clarified scope — the feature is presentational for groupings/details only.

**Alternatives considered**: Also hiding Default from the picker — rejected per clarification.

## Resolved unknowns

- **Default identity** → unique name `Default` only (Decision 2).
- **Exclusion location** → membership index builders (Decision 1).
- **"None" label + ordering** → `None`, `sortLast` at every level (Decision 3).
- **Add To Solution** → unchanged (Decision 5).

No open `NEEDS CLARIFICATION` items remain.
