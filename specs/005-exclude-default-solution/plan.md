# Implementation Plan: Exclude Default Solution from Groupings and Listings

**Branch**: `005-exclude-default-solution` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-exclude-default-solution/spec.md`

## Summary

Refine the Flows (`002`) and Connection References (`003`) categories so the environment's Default solution (matched by unique name `Default`, language-independent) is never shown in Solution groupings or in the details "Solutions" list. Objects previously grouped only under Default (or under no solution) collect into a single "None" group that always sorts last at every grouping level. If no solution has the `Default` unique name, behavior is unchanged.

Technical approach: exclude the Default solution at the point solution membership is indexed (so both grouping and details inherit it), rename the empty-solution group label to "None", and add a small, backward-compatible "sort last" flag to the shell's `GroupKey`/`GroupNode` so the forest builder orders the "None" group after all named solution groups.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) — inherits the existing tool.

**Primary Dependencies**: React 18, existing shell (`001`) and features `002`/`003`. No new dependencies.

**Storage**: None. Reads Dataverse solution membership already loaded by `002`/`003`.

**Testing**: Vitest + RTL. New unit tests for Default exclusion in the solution indices, the "None" label, and last-ordering in `buildForest`.

**Target Platform**: PPTB sandboxed iframe (unchanged).

**Project Type**: Single-project web app — edits to `src/lib/grouping.ts`, `src/models/types.ts`, and the flows/connection-references features.

**Performance Goals**: No change; exclusion is an in-memory filter over already-loaded data.

**Constraints**: Match Default by unique name only (never display name); do not remove objects; do not change the Add To Solution picker (Default stays selectable).

**Scale/Scope**: Small, localized refinement across two features + one shared grouping utility.

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Code Quality | Strict TS; small, single-purpose changes; no `any`; a shared `isDefaultSolution` helper avoids duplicated magic strings | PASS |
| II. UX Consistency | Presentational-only change via existing host-loaded data; no new host calls | PASS |
| III. Performance | In-memory filter over already-loaded membership; no extra queries; `$select` already includes `uniquename` | PASS |
| IV. Minimal Comments & Small Functions | Exclusion/ordering expressed as named helpers, not inline comments | PASS |

**Result**: PASS. No violations — Complexity Tracking not required.

> **Performance note (Principle III)**: `uniquename` is already selected in the existing solution-membership queries, so excluding Default adds no round-trips — it is a filter on data the tool already loads.

## Project Structure

### Documentation (this feature)

```text
specs/005-exclude-default-solution/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── grouping-sort.md
└── checklists/requirements.md
```

### Source Code (files touched)

```text
PowerAutomateManager.PPTB/src/
├── lib/
│   ├── solutions.ts            # NEW: DEFAULT_SOLUTION_UNIQUE_NAME + isDefaultSolution(uniqueName)
│   └── grouping.ts             # buildForest: order sortLast group keys after others (every level)
├── models/
│   └── types.ts                # GroupKey + GroupNode gain optional sortLast?: boolean
├── features/flows/
│   ├── flowState.ts            # SolutionRef gains uniqueName
│   ├── flowQueries.ts          # loadSolutionMembership: capture uniquename, exclude Default
│   └── flowGrouping.ts         # 'None' label + sortLast on the empty-solution key
└── features/connection-references/
    ├── connRefState.ts         # SolutionRef gains uniqueName
    ├── connRefQueries.ts       # buildSolutionsByRef: capture uniquename, exclude Default
    └── connRefGrouping.ts      # 'None' label + sortLast on the empty-solution key
```

**Structure Decision**: Extend the existing single-project layout. The only shell-level change is a backward-compatible `sortLast` flag on `GroupKey`/`GroupNode` and its use in `buildForest`; everything else is contained in the flows and connection-references features plus one new shared helper (`lib/solutions.ts`).

## Complexity Tracking

> No constitution violations. Section intentionally empty.
