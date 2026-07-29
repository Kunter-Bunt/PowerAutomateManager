import { describe, expect, it, beforeEach, vi } from 'vitest';
import { connectionActions } from '../../src/features/connections/connectionShare';
import { registerPickerHost } from '../../src/app/pickerService';
import type { ListItem } from '../../src/models/types';

const share = connectionActions.find((a) => a.id === 'share')!;
const ctx = {
  connection: { id: 'c', name: 'e', url: '', environment: 'Dev' as const, enabledForPowerPlatformAPI: true },
  refresh: () => undefined,
};
const conn = (id: string): ListItem => ({
  id,
  primaryText: id,
  searchText: id,
  raw: {},
});

let queryData: ReturnType<typeof vi.fn>;
let put: ReturnType<typeof vi.fn>;

const SERVICE_PRINCIPALS_RESPONSE = {
  value: [
    { systemuserid: 'u1', fullname: 'PPTB', applicationid: 'app1', azureactivedirectoryobjectid: 'sp1' },
    { systemuserid: 'u2', fullname: 'Sales Bot', applicationid: 'app2', azureactivedirectoryobjectid: 'sp2' },
  ],
};

function installHost(): void {
  put = vi.fn().mockResolvedValue({});
  queryData = vi.fn().mockResolvedValue(SERVICE_PRINCIPALS_RESPONSE);
  (window as unknown as { powerplatformAPI: unknown }).powerplatformAPI = {
    Connectivity: { Put: put },
  };
  (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
    queryData,
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
  it('grants the chosen Service Principal using its Azure AD object ID', async () => {
    registerPickerHost((_config, resolve) => resolve(['servicePrincipal:sp1']));
    const result = await share.run([conn('c1'), conn('c2')], ctx);
    expect(result).toEqual({ ok: true });
    expect(queryData).toHaveBeenCalledWith(expect.stringContaining('applicationid ne null'));
    expect(queryData).toHaveBeenCalledWith(expect.stringContaining('azureactivedirectoryobjectid ne null'));
    expect(put).toHaveBeenCalledTimes(2);
    const [path, body] = put.mock.calls[0] as [string, { properties: { principal: { id: string; type: string } } }];
    expect(path).toBe('connections/c1/permissions/sp1?api-version=2024-10-01');
    expect(body).toEqual({
      properties: { principal: { id: 'sp1', type: 'ServicePrincipal' }, roleName: 'CanView' },
    });
  });

  it('is a no-op when no principal is chosen', async () => {
    registerPickerHost((_config, resolve) => resolve(null));
    const result = await share.run([conn('c1')], ctx);
    expect(result).toEqual({ ok: true });
    expect(put).not.toHaveBeenCalled();
  });

  it('reports per-connection failure without aborting the batch', async () => {
    registerPickerHost((_config, resolve) => resolve(['servicePrincipal:sp1']));
    put.mockImplementation((path: string) =>
      path.includes('c2') ? Promise.reject(new Error('cannot manage')) : Promise.resolve({}),
    );
    const result = await share.run([conn('c1'), conn('c2')], ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures.map((f) => f.id)).toEqual(['c2']);
  });

  it('translates an "unknown API route" failure into a clearer unsupported-feature message', async () => {
    registerPickerHost((_config, resolve) => resolve(['servicePrincipal:sp1']));
    const rawError =
      'The request URI https://api.powerplatform.com/.../connections/c1/permissions/sp1 does not match any known API routes.';
    put.mockRejectedValue(new Error(rawError));
    const result = await share.run([conn('c1')], ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failures[0].reason).toBe(
        `Sharing connections is not currently supported by the Power Platform API on this host (no write endpoint exists yet for connection permissions). Details: ${rawError}`,
      );
    }
  });

  it('exposes only a Share action (no filters on this category)', () => {
    expect(connectionActions.map((a) => a.id)).toEqual(['share']);
  });

  it('warns and does nothing when the Power Platform API is not enabled', async () => {
    registerPickerHost((_config, resolve) => resolve(['servicePrincipal:sp1']));
    const result = await share.run([conn('c1')], {
      connection: { id: 'c', name: 'e', url: '', environment: 'Dev' },
      refresh: () => undefined,
    });
    expect(result).toEqual({ ok: false, failures: [{ id: 'c1', reason: 'Power Platform API is not enabled.' }] });
    expect(put).not.toHaveBeenCalled();
  });

  it('reports a failure instead of throwing when the Service Principal catalog cannot be loaded', async () => {
    registerPickerHost((_config, resolve) => resolve(['servicePrincipal:sp1']));
    queryData.mockRejectedValue(new Error('namespace not supported by host'));
    const result = await share.run([conn('c1')], ctx);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failures[0].reason).toContain('namespace not supported by host');
    expect(put).not.toHaveBeenCalled();
  });
});
