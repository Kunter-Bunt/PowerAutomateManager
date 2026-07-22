import { describe, expect, it } from 'vitest';
import { buildForest } from '../../src/lib/grouping';
import type { GroupingOption, ListItem } from '../../src/models/types';

function item(id: string, solutions: string[], state: 'On' | 'Off'): ListItem {
  return { id, primaryText: id, searchText: id, raw: { solutions, state } };
}

const bySolution: GroupingOption = {
  id: 'solution',
  label: 'Solution',
  keysFor: (i) =>
    ((i.raw as { solutions: string[] }).solutions ?? []).map((s) => ({ key: s, label: s })),
};

const byState: GroupingOption = {
  id: 'state',
  label: 'State',
  keysFor: (i) => [{ key: (i.raw as { state: string }).state, label: (i.raw as { state: string }).state }],
};

describe('buildForest', () => {
  it('returns an empty forest when there are no groupings', () => {
    expect(buildForest([item('a', ['S1'], 'On')], [])).toEqual([]);
  });

  it('places an item under each of its solution groups (multi-appearance)', () => {
    const forest = buildForest([item('a', ['S1', 'S2'], 'On')], [bySolution]);
    expect(forest.map((n) => n.key)).toEqual(['S1', 'S2']);
    expect(forest[0].itemIds).toEqual(['a']);
    expect(forest[1].itemIds).toEqual(['a']);
  });

  it('nests a second grouping level and aggregates subtree itemIds', () => {
    const items = [item('a', ['S1'], 'On'), item('b', ['S1'], 'Off'), item('c', ['S1'], 'Off')];
    const forest = buildForest(items, [bySolution, byState]);
    const s1 = forest.find((n) => n.key === 'S1');
    expect(s1).toBeDefined();
    expect(new Set(s1!.itemIds)).toEqual(new Set(['a', 'b', 'c']));
    const off = s1!.children.find((n) => n.key === 'Off');
    expect(new Set(off!.itemIds)).toEqual(new Set(['b', 'c']));
  });

  it('de-duplicates itemIds within a node', () => {
    const forest = buildForest([item('a', ['S1', 'S1'], 'On')], [bySolution]);
    expect(forest[0].itemIds).toEqual(['a']);
  });
});
