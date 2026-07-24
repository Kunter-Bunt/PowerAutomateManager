import { describe, expect, it, vi } from 'vitest';
import { runSequentialRetry, activateFlows } from '../../src/features/flows/flowActivation';
import type { ListItem } from '../../src/models/types';

const mk = (id: string, statecode?: number): ListItem => ({
  id,
  primaryText: id,
  searchText: id,
  raw: statecode === undefined ? {} : { statecode },
});

describe('runSequentialRetry', () => {
  it('activates one flow at a time (never in parallel)', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;
    const activate = async (): Promise<void> => {
      concurrent += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await Promise.resolve();
      await Promise.resolve();
      concurrent -= 1;
    };
    await runSequentialRetry([mk('1'), mk('2'), mk('3')], {
      isInTargetState: () => false,
      activate,
    });
    expect(maxConcurrent).toBe(1);
  });

  it('activates all in a single pass when a correct order is supplied', async () => {
    const calls: string[] = [];
    const failures = await runSequentialRetry([mk('A'), mk('B')], {
      order: ['B', 'A'],
      isInTargetState: () => false,
      activate: async (f) => {
        calls.push(f.id);
      },
    });
    expect(failures).toEqual([]);
    expect(calls).toEqual(['B', 'A']); // one pass, in order
  });

  it('retries until a dependency is satisfied, then succeeds', async () => {
    const activated = new Set<string>();
    const failures = await runSequentialRetry([mk('A'), mk('B')], {
      // No order hint: A depends on B, so A fails until B is activated.
      isInTargetState: () => false,
      activate: async (f) => {
        if (f.id === 'A' && !activated.has('B')) throw new Error('needs B');
        activated.add(f.id);
      },
    });
    expect(failures).toEqual([]);
    expect(activated).toEqual(new Set(['A', 'B']));
  });

  it('stops after a no-progress pass and reports the remaining flows', async () => {
    const failures = await runSequentialRetry([mk('X'), mk('Y')], {
      isInTargetState: () => false,
      activate: async (f) => {
        if (f.id === 'X') throw new Error('cannot modify');
      },
    });
    expect(failures.map((f) => f.id)).toEqual(['X']);
  });

  it('terminates on a permanently-failing flow (no infinite loop)', async () => {
    const failures = await runSequentialRetry([mk('X')], {
      isInTargetState: () => false,
      activate: async () => {
        throw new Error('always fails');
      },
    });
    expect(failures).toHaveLength(1);
  });

  it('skips flows already in the target state without a request', async () => {
    const activate = vi.fn().mockResolvedValue(undefined);
    const failures = await runSequentialRetry([mk('Z')], {
      isInTargetState: () => true,
      activate,
    });
    expect(failures).toEqual([]);
    expect(activate).not.toHaveBeenCalled();
  });

  it('reports progress: all waiting first, then active/done one at a time', async () => {
    const events: string[] = [];
    await runSequentialRetry([mk('A'), mk('B')], {
      order: ['A', 'B'],
      isInTargetState: () => false,
      activate: async () => undefined,
      onActive: (id) => events.push(`active:${id}`),
      onWaiting: (id) => events.push(`waiting:${id}`),
      onDone: (id) => events.push(`done:${id}`),
    });
    expect(events).toEqual([
      'waiting:A',
      'waiting:B',
      'active:A',
      'done:A',
      'active:B',
      'done:B',
    ]);
  });
});

describe('activateFlows', () => {
  function installHost(updateCalls: string[]): void {
    (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
      update: vi.fn().mockImplementation(async (_e: string, id: string) => {
        updateCalls.push(id);
      }),
      execute: vi.fn().mockImplementation(async (req: { parameters?: { ObjectId?: string } }) => {
        // B is required by A: querying dependents of B returns A.
        if (req.parameters?.ObjectId === 'B') {
          return {
            value: [
              { requiredcomponentobjectid: 'B', dependentcomponentobjectid: 'A', dependentcomponenttype: 29 },
            ],
          };
        }
        return { value: [] };
      }),
    };
  }

  it('turns flows on in dependency order (required first)', async () => {
    const updateCalls: string[] = [];
    installHost(updateCalls);
    const result = await activateFlows([mk('A'), mk('B')], 'on', new AbortController().signal);
    expect(result.ok).toBe(true);
    expect(updateCalls).toEqual(['B', 'A']);
    // Optimistic updates reflect the On state immediately (no re-fetch).
    expect(result.updates?.map((u) => u.id).sort()).toEqual(['A', 'B']);
    const a = result.updates?.find((u) => u.id === 'A');
    expect((a?.item?.raw as { statecode: number }).statecode).toBe(1);
  });

  it('turns flows off in reverse dependency order (dependents first)', async () => {
    const updateCalls: string[] = [];
    installHost(updateCalls);
    const result = await activateFlows([mk('A'), mk('B')], 'off', new AbortController().signal);
    expect(result.ok).toBe(true);
    expect(updateCalls).toEqual(['A', 'B']);
    const a = result.updates?.find((u) => u.id === 'A');
    expect((a?.item?.raw as { statecode: number }).statecode).toBe(0);
  });

  it('excludes failed flows from the optimistic updates', async () => {
    (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
      update: vi.fn().mockImplementation(async (_e: string, id: string) => {
        if (id === 'A') throw new Error('managed flow');
      }),
      execute: vi.fn().mockResolvedValue({ value: [] }),
    };
    const result = await activateFlows([mk('A'), mk('B')], 'on', new AbortController().signal);
    expect(result.ok).toBe(false);
    expect(result.updates?.map((u) => u.id)).toEqual(['B']);
  });
});
