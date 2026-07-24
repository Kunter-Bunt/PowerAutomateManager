import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearCache,
  getCached,
  invalidateCached,
  setCached,
} from '../../src/state/categoryCache';
import type { ListItem } from '../../src/models/types';

const item = (id: string): ListItem => ({ id, primaryText: id, searchText: id, raw: {} });

beforeEach(() => clearCache());

describe('categoryCache', () => {
  it('stores and returns items per connection + category', () => {
    setCached('conn-a', 'flows', [item('1')]);
    expect(getCached('conn-a', 'flows')).toEqual([item('1')]);
    expect(getCached('conn-a', 'connections')).toBeUndefined();
    expect(getCached('conn-b', 'flows')).toBeUndefined();
  });

  it('invalidates a single connection+category entry', () => {
    setCached('conn-a', 'flows', [item('1')]);
    invalidateCached('conn-a', 'flows');
    expect(getCached('conn-a', 'flows')).toBeUndefined();
  });

  it('clears everything', () => {
    setCached('conn-a', 'flows', [item('1')]);
    setCached('conn-b', 'connections', [item('2')]);
    clearCache();
    expect(getCached('conn-a', 'flows')).toBeUndefined();
    expect(getCached('conn-b', 'connections')).toBeUndefined();
  });
});
