# Data Model: Exclude Default Solution from Groupings and Listings

**Feature**: 005-exclude-default-solution | **Date**: 2026-07-24 | **Phase**: 1

Only small, additive changes to existing types.

## Changed types

### SolutionRef (flows `flowState.ts`, connection-references `connRefState.ts`)
- Existing: `{ id: string; name: string }`.
- **Add** `uniqueName: string` — the solution's language-independent unique name, used to identify and exclude the Default solution.

### GroupKey (shell `models/types.ts`)
- Existing: `{ key: string; label: string }`.
- **Add** optional `sortLast?: boolean` — when true, the produced group sorts after all non-`sortLast` groups at its level.

### GroupNode (shell `models/types.ts`)
- Existing: `{ key; label; children; itemIds }`.
- **Add** optional `sortLast?: boolean` — carried from the `GroupKey` so `buildForest` can order it last.

## Rules

- **Exclusion**: When building `solutionsByFlow` / `solutionsByRef`, a solution row is skipped when `isDefaultSolution(row.uniqueName)` is true (unique name equals `Default`). If no row matches, nothing is excluded (safe fallback, FR-009).
- **"None" key**: The Solution `keysFor` returns `{ key: '__none__', label: 'None', sortLast: true }` when an object's (post-exclusion) solution list is empty. Objects only in Default, or in no solution, produce this key (FR-005, FR-006).
- **Ordering**: `buildForest` sorts each level by `sortLast` (false first) then `label.localeCompare`. Recursion applies this at every level (FR-007). No "None" group appears if no item yields the key (FR-008).
- **Details**: The details "Solutions" list is derived from the (already Default-excluded) membership index, so Default never appears (FR-003); empty lists show the existing "Not in any solution" empty text.
- **Unaffected**: State/Owner/Connector groupings, the Connections category, and the Add To Solution picker (Default still selectable, FR-011).

## Entities (conceptual)

- **Default Solution** — solution with unique name `Default`; excluded from groupings/details.
- **"None" group** — single terminal group (`__none__`, label "None", `sortLast`) collecting objects with no non-Default solution.
