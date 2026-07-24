import { describe, expect, it, vi } from 'vitest';
import { buildSolutionsByRef } from '../../src/features/connection-references/connRefQueries';

function installDataverse(rows: Record<string, unknown>[]): void {
  (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
    fetchXmlQuery: vi.fn().mockResolvedValue({ value: rows }),
  };
}

describe('connection reference solution membership excludes the Default solution', () => {
  it('drops Default and keeps named solutions', async () => {
    installDataverse([
      { objectid: 'r1', 'sol.solutionid': 'D', 'sol.uniquename': 'Default', 'sol.friendlyname': 'Default' },
      { objectid: 'r1', 'sol.solutionid': 'S1', 'sol.uniquename': 'sol_one', 'sol.friendlyname': 'Sol One' },
    ]);
    const map = await buildSolutionsByRef(['r1'], new AbortController().signal);
    expect(map.get('r1')).toEqual([{ id: 'S1', name: 'Sol One', uniqueName: 'sol_one' }]);
  });

  it('returns an empty map (no result rows) when there are no reference ids', async () => {
    installDataverse([]);
    const map = await buildSolutionsByRef([], new AbortController().signal);
    expect(map.size).toBe(0);
  });
});
