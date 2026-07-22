import type { GroupingOption, GroupNode, ListItem } from '../models/types';

function uniqueIds(items: ListItem[]): string[] {
  return [...new Set(items.map((i) => i.id))];
}

/**
 * Builds a forest of group nodes from a flat item list and an ordered list of
 * grouping options (1..n levels). An item that yields multiple keys at a level
 * (e.g. a flow in several solutions) appears under each matching group. Each
 * node's itemIds contains every distinct item id within its subtree.
 */
export function buildForest(items: ListItem[], groupings: GroupingOption[]): GroupNode[] {
  if (groupings.length === 0) return [];
  const [head, ...rest] = groupings;

  const buckets = new Map<string, { label: string; items: ListItem[] }>();
  for (const item of items) {
    for (const groupKey of head.keysFor(item)) {
      const bucket = buckets.get(groupKey.key);
      if (bucket) {
        bucket.items.push(item);
      } else {
        buckets.set(groupKey.key, { label: groupKey.label, items: [item] });
      }
    }
  }

  const nodes: GroupNode[] = [];
  for (const [key, bucket] of buckets) {
    nodes.push({
      key,
      label: bucket.label,
      children: buildForest(bucket.items, rest),
      itemIds: uniqueIds(bucket.items),
    });
  }
  nodes.sort((a, b) => a.label.localeCompare(b.label));
  return nodes;
}
