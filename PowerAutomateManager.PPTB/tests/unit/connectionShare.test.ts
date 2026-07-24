import { describe, expect, it, beforeEach, vi } from 'vitest';
import { connectionActions } from '../../src/features/connections/connectionShare';
import { registerPickerHost } from '../../src/app/pickerService';
import type { ListItem } from '../../src/models/types';

const share = connectionActions.find((a) => a.id === 'share')!;
const ctx = {
  connection: { id: 'c', name: 'e', url: '', environment: 'Dev' as const, enabledForPowerPlatformAPI: true },
  refresh: () => undefined,
};
const conn = (id: string): ListItem => ({ id, primaryText: id, searchText: id, raw: {} });

let post: ReturnType<typeof vi.fn>;

function installHost(): void {
  post = vi.fn().mockResolvedValue({});
  (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
    queryData: vi.fn().mockImplementation((odata: string) =>
      odata.includes('systemusers')
        ? {
            value: [
              { systemuserid: 'u1', fullname: 'Alice' },
              { systemuserid: 'a1', fullname: 'App One', applicationid: 'app-guid' },
            ],
          }
        : { value: [{ teamid: 't1', name: 'Sales' }] },
    ),
  };
  (window as unknown as { powerplatformAPI: unknown }).powerplatformAPI = {
    Connectivity: { Post: post },
  };
  (window as unknown as { toolboxAPI: unknown }).toolboxAPI = {
    utils: { showNotification: vi.fn().mockResolvedValue(undefined) },
  };
}

beforeEach(() => {
  installHost();
  registerPickerHost(null);
});

describe('Share connections', () => {
  it('grants the chosen User, Team, and S2S App to each selected connection', async () => {
    registerPickerHost((_config, resolve) => resolve(['user:u1', 'team:t1', 's2s:a1']));
    const result = await share.run([conn('c1'), conn('c2')], ctx);
    expect(result).toEqual({ ok: true });
    expect(post).toHaveBeenCalledTimes(2);
    const [, body] = post.mock.calls[0] as [string, { put: unknown[] }];
    expect(body.put).toHaveLength(3);
  });

  it('is a no-op when no principal is chosen', async () => {
    registerPickerHost((_config, resolve) => resolve(null));
    const result = await share.run([conn('c1')], ctx);
    expect(result).toEqual({ ok: true });
    expect(post).not.toHaveBeenCalled();
  });

  it('reports per-connection failure without aborting the batch', async () => {
    registerPickerHost((_config, resolve) => resolve(['user:u1']));
    post.mockImplementation((path: string) =>
      path.includes('c2') ? Promise.reject(new Error('cannot manage')) : Promise.resolve({}),
    );
    const result = await share.run([conn('c1'), conn('c2')], ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures.map((f) => f.id)).toEqual(['c2']);
  });

  it('exposes only a Share action (no filters on this category)', () => {
    expect(connectionActions.map((a) => a.id)).toEqual(['share']);
  });

  it('warns and does nothing when the Power Platform API is not enabled', async () => {
    registerPickerHost((_config, resolve) => resolve(['user:u1']));
    const result = await share.run([conn('c1')], {
      connection: { id: 'c', name: 'e', url: '', environment: 'Dev' },
      refresh: () => undefined,
    });
    expect(result).toEqual({ ok: true });
    expect(post).not.toHaveBeenCalled();
  });
});
