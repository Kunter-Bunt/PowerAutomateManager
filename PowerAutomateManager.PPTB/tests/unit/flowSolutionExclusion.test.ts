import { describe, expect, it, vi } from 'vitest';
import { loadSolutionMembership } from '../../src/features/flows/flowQueries';

function installDataverse(rows: Record<string, unknown>[]): void {
  (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
    fetchXmlQuery: vi.fn().mockResolvedValue({ value: rows }),
  };
}

describe('flow solution membership excludes the Default solution', () => {
  it('drops rows whose solution unique name is Default, keeping the rest', async () => {
    installDataverse([
      {
        objectid: 'f1',
        'sol.solutionid': 'D',
        'sol.uniquename': 'Default',
        'sol.friendlyname': 'Common Data Services Default Solution',
      },
      {
        objectid: 'f1',
        'sol.solutionid': 'S1',
        'sol.uniquename': 'sol_one',
        'sol.friendlyname': 'Sol One',
      },
    ]);
    const map = await loadSolutionMembership(new AbortController().signal);
    expect(map.get('f1')).toEqual([{ id: 'S1', name: 'Sol One', uniqueName: 'sol_one' }]);
  });

  it('leaves a flow out of the map entirely when its only solution is Default', async () => {
    installDataverse([
      { objectid: 'f2', 'sol.solutionid': 'D', 'sol.uniquename': 'Default', 'sol.friendlyname': 'Default' },
    ]);
    const map = await loadSolutionMembership(new AbortController().signal);
    expect(map.has('f2')).toBe(false);
  });
});
