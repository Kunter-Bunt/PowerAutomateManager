import { describe, expect, it, beforeEach } from 'vitest';
import { connRefGroupingOptions } from '../../src/features/connection-references/connRefGrouping';
import { connRefFilters } from '../../src/features/connection-references/connRefFilters';
import { setConnRefIndex } from '../../src/features/connection-references/connRefState';
import type { ListItem } from '../../src/models/types';

const [bySolution, byConnector] = connRefGroupingOptions;
const [managedFilter] = connRefFilters;

const ref = (id: string, connector: string, ismanaged: boolean): ListItem => ({
  id,
  primaryText: id,
  searchText: id,
  raw: { connectorid: connector, ismanaged },
});

beforeEach(() => {
  setConnRefIndex({
    flowsByLogical: new Map(),
    solutionsByRef: new Map([['1', [{ id: 'S1', name: 'Sol One' }]]]),
    connectionsByConnector: new Map(),
  });
});

describe('connection reference grouping', () => {
  it('groups by solution', () => {
    expect(bySolution.keysFor(ref('1', 'shared_a', false))).toEqual([{ key: 'S1', label: 'Sol One' }]);
    expect(bySolution.keysFor(ref('2', 'shared_a', false))).toEqual([
      { key: '__none__', label: 'No solution' },
    ]);
  });

  it('groups by connector', () => {
    expect(byConnector.keysFor(ref('1', 'shared_a', false))[0].key).toBe('shared_a');
  });
});

describe('connection reference managed filter', () => {
  it('filters by managed/unmanaged', () => {
    expect(managedFilter.predicate(ref('1', 'shared_a', true), ['managed'])).toBe(true);
    expect(managedFilter.predicate(ref('1', 'shared_a', true), ['unmanaged'])).toBe(false);
    expect(managedFilter.predicate(ref('1', 'shared_a', false), ['unmanaged'])).toBe(true);
  });
});
