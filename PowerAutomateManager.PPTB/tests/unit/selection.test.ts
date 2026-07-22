import { describe, expect, it } from 'vitest';
import { SelectionModel } from '../../src/state/SelectionModel';

const visible = ['a', 'b', 'c', 'd'];

describe('SelectionModel', () => {
  it('plain click selects one and sets the anchor', () => {
    const sel = new SelectionModel().selectOne('b');
    expect(sel.ids).toEqual(['b']);
    expect(sel.size).toBe(1);
  });

  it('CTRL click toggles membership independently', () => {
    let sel = new SelectionModel().selectOne('a');
    sel = sel.toggle('c');
    expect(new Set(sel.ids)).toEqual(new Set(['a', 'c']));
    sel = sel.toggle('a');
    expect(sel.ids).toEqual(['c']);
  });

  it('SHIFT click selects a contiguous range from the anchor', () => {
    const sel = new SelectionModel().selectOne('a').selectRange('c', visible);
    expect(new Set(sel.ids)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('SHIFT click without an anchor falls back to selecting one', () => {
    const sel = new SelectionModel().selectRange('c', visible);
    expect(sel.ids).toEqual(['c']);
  });

  it('selectIds de-duplicates ids (group-node selection)', () => {
    const sel = new SelectionModel().selectOne('a').selectIds(['a', 'b', 'b']);
    expect(new Set(sel.ids)).toEqual(new Set(['a', 'b']));
  });

  it('selectAll selects every visible id', () => {
    const sel = new SelectionModel().selectAll(visible);
    expect(new Set(sel.ids)).toEqual(new Set(visible));
  });

  it('reconcile drops ids that no longer exist', () => {
    const sel = new SelectionModel().selectAll(visible).reconcile(['a', 'c']);
    expect(new Set(sel.ids)).toEqual(new Set(['a', 'c']));
  });

  it('clear empties the selection', () => {
    expect(new SelectionModel().selectAll(visible).clear().size).toBe(0);
  });
});
