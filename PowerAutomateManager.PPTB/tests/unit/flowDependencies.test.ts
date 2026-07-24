import { describe, expect, it } from 'vitest';
import { topologicalOrder, type DependencyEdge } from '../../src/features/flows/flowDependencies';

describe('topologicalOrder', () => {
  it('orders required flows before their dependents', () => {
    // B is required by A -> B must come first.
    const order = topologicalOrder(['A', 'B'], [['B', 'A']]);
    expect(order).toEqual(['B', 'A']);
  });

  it('returns the ids as-is when there are no edges', () => {
    expect(topologicalOrder(['A', 'B', 'C'], [])).toEqual(['A', 'B', 'C']);
  });

  it('returns null on a cycle', () => {
    const edges: DependencyEdge[] = [
      ['A', 'B'],
      ['B', 'A'],
    ];
    expect(topologicalOrder(['A', 'B'], edges)).toBeNull();
  });

  it('ignores edges to ids outside the selection and self-edges', () => {
    const edges: DependencyEdge[] = [
      ['B', 'A'],
      ['X', 'A'], // X not selected -> ignored
      ['A', 'A'], // self -> ignored
    ];
    expect(topologicalOrder(['A', 'B'], edges)).toEqual(['B', 'A']);
  });

  it('handles a longer chain (C requires B requires A)', () => {
    const order = topologicalOrder(['A', 'B', 'C'], [
      ['A', 'B'],
      ['B', 'C'],
    ]);
    expect(order).toEqual(['A', 'B', 'C']);
  });
});
