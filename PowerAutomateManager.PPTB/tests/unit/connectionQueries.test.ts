import { describe, expect, it, vi } from 'vitest';
import { parseConnections, loadConnections } from '../../src/features/connections/connectionQueries';
import type { Connection } from '../../src/models/hostApi';

const enabled: Connection = {
  id: 'c',
  name: 'Env',
  url: '',
  environment: 'Dev',
  enabledForPowerPlatformAPI: true,
};

describe('parseConnections', () => {
  it('parses the Connectivity connections payload', () => {
    const parsed = parseConnections({
      value: [
        {
          name: 'conn1',
          properties: {
            displayName: 'SharePoint',
            apiId: '/providers/.../sharepointonline',
            createdBy: { displayName: 'Alice' },
          },
        },
      ],
    });
    expect(parsed).toEqual([
      {
        id: 'conn1',
        displayName: 'SharePoint',
        connector: '/providers/.../sharepointonline',
        owner: 'Alice',
      },
    ]);
  });

  it('handles a data.value wrapper and missing fields', () => {
    const parsed = parseConnections({ data: { value: [{ name: 'c2' }] } });
    expect(parsed[0]).toEqual({ id: 'c2', displayName: 'c2', connector: '', owner: '' });
  });
});

describe('loadConnections', () => {
  it('throws a descriptive error when the connection is not enabled for the Power Platform API', async () => {
    await expect(
      loadConnections({ ...enabled, enabledForPowerPlatformAPI: false }, new AbortController().signal),
    ).rejects.toThrow(/Power Platform API/);
  });

  it('returns parsed connections when enabled', async () => {
    (window as unknown as { powerplatformAPI: unknown }).powerplatformAPI = {
      Connectivity: { Get: vi.fn().mockResolvedValue({ value: [{ name: 'c1' }] }) },
    };
    const result = await loadConnections(enabled, new AbortController().signal);
    expect(result[0].id).toBe('c1');
  });
});
