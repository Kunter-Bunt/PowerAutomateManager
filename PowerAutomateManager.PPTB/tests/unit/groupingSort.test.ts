import { describe, expect, it } from 'vitest';
import { buildForest } from '../../src/lib/grouping';
import type { GroupingOption, GroupKey, ListItem } from '../../src/models/types';

function item(id: string, key: GroupKey): ListItem {
  return { id, primaryText: id, searchText: id, raw: { key } };
}

const byKey: GroupingOption = {
  id: 'k',
  label: 'K',
  keysFor: (i) => [(i.raw as { key: GroupKey }).key],
};

describe('buildForest sortLast ordering', () => {
  it('orders sortLast groups after all named groups, regardless of alphabetical order', () => {
    const forest = buildForest(
      [
        item('a', { key: '__none__', label: 'None', sortLast: true }),
        item('b', { key: 'z', label: 'Zeta' }),
        item('c', { key: 'm', label: 'Alpha' }),
      ],
      [byKey],
    );
    expect(forest.map((n) => n.label)).toEqual(['Alpha', 'Zeta', 'None']);
  });

  it('keeps the sortLast group last within each parent when nested', () => {
    const byParent: GroupingOption = {
      id: 'p',
      label: 'P',
      keysFor: (i) => [(i.raw as { parent: GroupKey }).parent],
    };
    const nested = (id: string, parent: GroupKey, key: GroupKey): ListItem => ({
      id,
      primaryText: id,
      searchText: id,
      raw: { parent, key },
    });
    const forest = buildForest(
      [
        nested('a', { key: 'P1', label: 'P1' }, { key: '__none__', label: 'None', sortLast: true }),
        nested('b', { key: 'P1', label: 'P1' }, { key: 'x', label: 'Xigma' }),
      ],
      [byParent, byKey],
    );
    expect(forest[0].children.map((n) => n.label)).toEqual(['Xigma', 'None']);
  });
});
