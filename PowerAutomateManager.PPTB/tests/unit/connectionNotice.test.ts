import { describe, expect, it } from 'vitest';
import { connectionsModule } from '../../src/features/connections/connectionsModule';
import { connectionActions } from '../../src/features/connections/connectionShare';
import type { Connection } from '../../src/models/hostApi';
import type { ListItem } from '../../src/models/types';

const share = connectionActions.find((a) => a.id === 'share')!;
const item: ListItem = { id: 'c1', primaryText: 'c1', searchText: 'c1', raw: {} };
const base: Connection = { id: 'c', name: 'e', url: '', environment: 'Dev' };

describe('connections Power Platform API notice + Share gating', () => {
  it('warns when the Power Platform API is not enabled', () => {
    const notice = connectionsModule.getNotice!({ ...base, enabledForPowerPlatformAPI: false });
    expect(notice?.level).toBe('warning');
    expect(notice?.message).toMatch(/Power Platform API/);
    expect(notice?.message).toMatch(/Connectivity \(Connections\)/);
    expect(notice?.link?.href).toBe(
      'https://docs.powerplatformtoolbox.com/tool-development/api-reference/powerplatform-api',
    );
  });

  it('shows no notice when the Power Platform API is enabled', () => {
    expect(connectionsModule.getNotice!({ ...base, enabledForPowerPlatformAPI: true })).toBeNull();
  });

  it('shows no notice when there is no connection', () => {
    expect(connectionsModule.getNotice!(null)).toBeNull();
  });

  it('disables Share when the Power Platform API is not enabled', () => {
    expect(share.enabled([item], { connection: { ...base, enabledForPowerPlatformAPI: false } })).toBe(false);
    expect(share.enabled([item], { connection: { ...base, enabledForPowerPlatformAPI: true } })).toBe(true);
  });
});
