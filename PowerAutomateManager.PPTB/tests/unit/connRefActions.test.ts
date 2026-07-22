import { describe, expect, it, beforeEach, vi } from 'vitest';
import { connRefActions } from '../../src/features/connection-references/connRefActions';
import { setConnRefIndex } from '../../src/features/connection-references/connRefState';
import { registerPickerHost } from '../../src/app/pickerService';
import type { ListItem } from '../../src/models/types';

const changeConnection = connRefActions.find((a) => a.id === 'change-connection')!;
const merge = connRefActions.find((a) => a.id === 'merge')!;

const ctx = { connection: { id: 'c', name: 'e', url: '', environment: 'Dev' as const }, refresh: () => undefined };
const ref = (id: string, connector: string): ListItem => ({
  id,
  primaryText: id,
  searchText: id,
  raw: { connectorid: connector },
});

let update: ReturnType<typeof vi.fn>;

function installHost(): void {
  update = vi.fn().mockResolvedValue(undefined);
  (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
    update,
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
  setConnRefIndex({
    flowsByLogical: new Map(),
    solutionsByRef: new Map(),
    connectionsByConnector: new Map([
      ['shared_a', [{ value: 'conn1', label: 'C1' }, { value: 'conn2', label: 'C2' }]],
    ]),
  });
});

describe('Merge', () => {
  it('is disabled when the selection spans more than one connector', () => {
    expect(merge.enabled([ref('1', 'shared_a'), ref('2', 'shared_b')])).toBe(false);
    expect(merge.enabled([ref('1', 'shared_a'), ref('2', 'shared_a')])).toBe(true);
  });

  it('blocks merging references with different connectors', async () => {
    const result = await merge.run([ref('1', 'shared_a'), ref('2', 'shared_b')], ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures[0].reason).toMatch(/same connector/i);
    }
    expect(update).not.toHaveBeenCalled();
  });

  it('consolidates same-connector references onto the chosen master connection', async () => {
    registerPickerHost((_config, resolve) => resolve(['conn2']));
    const result = await merge.run([ref('1', 'shared_a'), ref('2', 'shared_a')], ctx);
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith('connectionreference', '1', { connectionid: 'conn2' });
    expect(update).toHaveBeenCalledWith('connectionreference', '2', { connectionid: 'conn2' });
  });
});

describe('Change Connection', () => {
  it('repoints selected references to the chosen connection', async () => {
    registerPickerHost((_config, resolve) => resolve(['conn1']));
    const result = await changeConnection.run([ref('1', 'shared_a')], ctx);
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith('connectionreference', '1', { connectionid: 'conn1' });
  });

  it('reports per-reference failure without aborting the batch', async () => {
    registerPickerHost((_config, resolve) => resolve(['conn1']));
    update.mockImplementation((_e: string, id: string) =>
      id === '2' ? Promise.reject(new Error('managed reference')) : Promise.resolve(),
    );
    const result = await changeConnection.run([ref('1', 'shared_a'), ref('2', 'shared_a')], ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures.map((f) => f.id)).toEqual(['2']);
  });
});
