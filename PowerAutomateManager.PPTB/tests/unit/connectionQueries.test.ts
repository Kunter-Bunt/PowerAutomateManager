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
            environment: { id: 'env1' },
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
  it('derives connections from Dataverse connection references when the Power Platform API is not enabled', async () => {
    (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
      fetchXmlQuery: vi.fn().mockResolvedValue({
        value: [
          { connectionid: 'conn1', connectorid: 'shared_sharepointonline', connectionreferencedisplayname: 'SP Ref' },
          { connectionid: 'conn1', connectorid: 'shared_sharepointonline', connectionreferencedisplayname: 'SP Ref 2' },
          { connectionid: 'conn2', connectorid: 'shared_sql', connectionreferencedisplayname: 'SQL Ref' },
        ],
      }),
    };
    const result = await loadConnections(
      { ...enabled, enabledForPowerPlatformAPI: false },
      new AbortController().signal,
    );
    expect(result.map((c) => c.id)).toEqual(['conn1', 'conn2']);
    expect(result[0]).toEqual({
      id: 'conn1',
      displayName: 'SP Ref',
      connector: 'shared_sharepointonline',
      owner: '',
    });
  });

  it('uses the Power Platform API when the connection is enabled', async () => {
    (window as unknown as { powerplatformAPI: unknown }).powerplatformAPI = {
      Connectivity: { Get: vi.fn().mockResolvedValue({ value: [{ name: 'c1' }] }) },
    };
    const result = await loadConnections(enabled, new AbortController().signal);
    expect(result[0].id).toBe('c1');
  });

  it('falls back to Dataverse when the Power Platform API returns nothing', async () => {
    (window as unknown as { powerplatformAPI: unknown }).powerplatformAPI = {
      Connectivity: { Get: vi.fn().mockResolvedValue({ value: [] }) },
    };
    (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
      fetchXmlQuery: vi.fn().mockResolvedValue({
        value: [{ connectionid: 'conn9', connectorid: 'shared_x', connectionreferencedisplayname: 'X' }],
      }),
    };
    const result = await loadConnections(enabled, new AbortController().signal);
    expect(result.map((c) => c.id)).toEqual(['conn9']);
  });
});
