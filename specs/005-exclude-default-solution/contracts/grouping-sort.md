# Contract: Grouping Sort & Default Solution Helper

**Feature**: 005-exclude-default-solution | **Phase**: 1

## Shared helper — `src/lib/solutions.ts`

```ts
export const DEFAULT_SOLUTION_UNIQUE_NAME = 'Default';

export function isDefaultSolution(uniqueName: string): boolean {
  return uniqueName === DEFAULT_SOLUTION_UNIQUE_NAME;
}
```

Rules: matches by unique name only (language-independent, FR-001). Used by both flows and connection-references membership builders.

## Shell type change — `GroupKey` / `GroupNode`

```ts
export interface GroupKey {
  key: string;
  label: string;
  sortLast?: boolean; // when true, sorts after all non-sortLast groups at its level
}

export interface GroupNode {
  key: string;
  label: string;
  children: GroupNode[];
  itemIds: string[];
  sortLast?: boolean;
}
```

## Ordering contract — `buildForest`

```ts
// Nodes at each level are ordered:
nodes.sort(
  (a, b) => Number(a.sortLast ?? false) - Number(b.sortLast ?? false) || a.label.localeCompare(b.label),
);
```

Rules:
- A node's `sortLast` is taken from the `GroupKey` that created it.
- `sortLast` groups always follow non-`sortLast` groups at the same level; among equal `sortLast`, alphabetical by label.
- Applied at every recursion level (top-level and nested "Then by").
- Backward compatible: keys without `sortLast` behave exactly as before.

## Solution grouping contract (flows & connection references)

```ts
keysFor(item): GroupKey[] {
  const solutions = /* Default-excluded membership for item */;
  if (solutions.length === 0) return [{ key: '__none__', label: 'None', sortLast: true }];
  return solutions.map((s) => ({ key: s.id, label: s.name })); // named groups, not sortLast
}
```
