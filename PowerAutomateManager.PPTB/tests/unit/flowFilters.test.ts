import { describe, expect, it } from 'vitest';
import { flowFilters } from '../../src/features/flows/flowFilters';
import { flowRowStyle } from '../../src/features/flows/flowRowStyle';
import type { ListItem } from '../../src/models/types';

const [stateFilter, managedFilter] = flowFilters;

function flow(statecode: number, ismanaged: boolean): ListItem {
  return { id: 'x', primaryText: 'x', searchText: 'x', raw: { statecode, ismanaged } };
}

describe('flow filters', () => {
  it('filters by state', () => {
    expect(stateFilter.predicate(flow(1, false), ['on'])).toBe(true);
    expect(stateFilter.predicate(flow(1, false), ['off'])).toBe(false);
    expect(stateFilter.predicate(flow(0, false), ['off'])).toBe(true);
  });

  it('filters by managed/unmanaged', () => {
    expect(managedFilter.predicate(flow(1, true), ['managed'])).toBe(true);
    expect(managedFilter.predicate(flow(1, true), ['unmanaged'])).toBe(false);
    expect(managedFilter.predicate(flow(1, false), ['unmanaged'])).toBe(true);
  });
});

describe('flow row style', () => {
  it('colors On flows positive and Off flows negative with a badge', () => {
    expect(flowRowStyle(flow(1, false))).toEqual({ accent: 'positive', badge: 'On' });
    expect(flowRowStyle(flow(0, false))).toEqual({ accent: 'negative', badge: 'Off' });
  });
});
