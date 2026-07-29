import { describe, expect, it, beforeEach, vi } from 'vitest';
import { flowActions } from '../../src/features/flows/flowActions';
import { flowIndex } from '../../src/features/flows/flowState';
import { registerPickerHost } from '../../src/app/pickerService';
import type { ListItem } from '../../src/models/types';

const turnOn = flowActions.find((a) => a.id === 'turn-on')!;
const turnOff = flowActions.find((a) => a.id === 'turn-off')!;
const changeOwner = flowActions.find((a) => a.id === 'change-owner')!;
const addToSolution = flowActions.find((a) => a.id === 'add-to-solution')!;

const mk = (id: string): ListItem => ({ id, primaryText: id, searchText: id, raw: {} });
const ctx = { connection: { id: 'c', name: 'e', url: '', environment: 'Dev' as const }, refresh: () => undefined };

let update: ReturnType<typeof vi.fn>;

function installHost(): void {
  update = vi.fn().mockResolvedValue(undefined);
  (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
    update,
    queryData: vi.fn().mockResolvedValue({ value: [{ systemuserid: 'u1', fullname: 'Alice' }] }),
    getSolutions: vi.fn().mockResolvedValue({ value: [] }),
    execute: vi.fn().mockResolvedValue({}),
  };
  (window as unknown as { toolboxAPI: unknown }).toolboxAPI = {
    utils: { showNotification: vi.fn().mockResolvedValue(undefined) },
  };
}

beforeEach(() => {
  installHost();
  registerPickerHost(null);
});

describe('flow bulk actions', () => {
  it('Turn On sets statecode/statuscode for every selected flow', async () => {
    const result = await turnOn.run([mk('1'), mk('2')], ctx);
    expect(result.ok).toBe(true);
    expect(update).toHaveBeenCalledWith('workflow', '1', { statecode: 1, statuscode: 2 });
    expect(update).toHaveBeenCalledWith('workflow', '2', { statecode: 1, statuscode: 2 });
  });

  it('Turn Off sets the disabled state', async () => {
    await turnOff.run([mk('1')], ctx);
    expect(update).toHaveBeenCalledWith('workflow', '1', { statecode: 0, statuscode: 1 });
  });

  it('reports per-flow failure without aborting the batch', async () => {
    update.mockImplementation((_e: string, id: string) =>
      id === '2' ? Promise.reject(new Error('managed flow')) : Promise.resolve(),
    );
    const result = await turnOn.run([mk('1'), mk('2'), mk('3')], ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures.map((f) => f.id)).toEqual(['2']);
    }
  });

  it('Change Owner reassigns via ownerid bind when a user is picked', async () => {
    registerPickerHost((_config, resolve) => resolve(['u1']));
    const result = await changeOwner.run([mk('1')], ctx);
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith('workflow', '1', {
      'ownerid@odata.bind': '/systemusers(u1)',
    });
  });

  it('Change Owner is a no-op when the picker is cancelled', async () => {
    registerPickerHost((_config, resolve) => resolve(null));
    const result = await changeOwner.run([mk('1')], ctx);
    expect(result).toEqual({ ok: true });
    expect(update).not.toHaveBeenCalled();
  });

  it('Add To Solution records membership so grouping reflects it', async () => {
    flowIndex.solutionsByFlow = new Map();
    (window as unknown as { dataverseAPI: { getSolutions: unknown } }).dataverseAPI.getSolutions = vi
      .fn()
      .mockResolvedValue({
        value: [
          { solutionid: 's1', uniquename: 'mysol', friendlyname: 'My Solution', ismanaged: false },
        ],
      });
    registerPickerHost((_config, resolve) => resolve(['mysol']));
    const result = await addToSolution.run([mk('f1')], ctx);
    expect(result).toEqual({ ok: true });
    expect(flowIndex.solutionsByFlow.get('f1')).toEqual([
      { id: 's1', name: 'My Solution', uniqueName: 'mysol' },
    ]);
  });
});
