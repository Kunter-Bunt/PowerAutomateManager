import { describe, expect, it, beforeEach } from 'vitest';
import { connectionGroupingOptions } from '../../src/features/connections/connectionGrouping';
import { connectionDetails } from '../../src/features/connections/connectionDetails';
import { setConnectionIndex, type ParsedConnection } from '../../src/features/connections/connectionState';
import type { ListItem } from '../../src/models/types';

const [byOwner, byConnector] = connectionGroupingOptions;

const connItem = (id: string, raw: ParsedConnection): ListItem => ({
  id,
  primaryText: raw.displayName,
  searchText: raw.displayName,
  raw,
});

beforeEach(() => {
  setConnectionIndex({ flowsByConnection: new Map([['c1', ['Flow A']]]) });
});

describe('connection grouping', () => {
  it('groups by owner and connector', () => {
    const item = connItem('c1', { id: 'c1', displayName: 'C1', connector: 'shared_sp', owner: 'Alice' });
    expect(byOwner.keysFor(item)[0]).toEqual({ key: 'Alice', label: 'Alice' });
    expect(byConnector.keysFor(item)[0]).toEqual({ key: 'shared_sp', label: 'shared_sp' });
  });
});

describe('connectionDetails', () => {
  it('shows name, owner, and flows using it', async () => {
    const item = connItem('c1', { id: 'c1', displayName: 'C1', connector: 'shared_sp', owner: 'Alice' });
    const fields = await connectionDetails(item);
    const byLabel = Object.fromEntries(fields.map((f) => [f.label, f.value]));
    expect(byLabel['Name']).toBe('C1');
    expect(byLabel['Owner']).toBe('Alice');
    expect(byLabel['Flows Using It']).toEqual(['Flow A']);
  });

  it('shows an empty indication when no flows use the connection', async () => {
    const item = connItem('c9', { id: 'c9', displayName: 'C9', connector: '', owner: '' });
    const fields = await connectionDetails(item);
    expect(fields.find((f) => f.label === 'Flows Using It')?.value).toEqual([]);
  });
});
