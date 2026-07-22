import { describe, expect, it, beforeEach } from 'vitest';
import { connRefDetails } from '../../src/features/connection-references/connRefDetails';
import { setConnRefIndex } from '../../src/features/connection-references/connRefState';
import type { ListItem } from '../../src/models/types';

const ref: ListItem = {
  id: 'r1',
  primaryText: 'SharePoint Ref',
  searchText: 'SharePoint Ref',
  raw: {
    connectionreferencelogicalname: 'new_sp',
    connectorid: 'shared_sharepointonline',
    connectionid: 'conn-123',
  },
};

beforeEach(() => {
  setConnRefIndex({
    flowsByLogical: new Map([['new_sp', ['Flow A', 'Flow B']]]),
    solutionsByRef: new Map([['r1', [{ id: 'S1', name: 'Sol One' }]]]),
    connectionsByConnector: new Map(),
  });
});

describe('connRefDetails', () => {
  it('shows name, connection, solutions, and flows using it', async () => {
    const fields = await connRefDetails(ref);
    const byLabel = Object.fromEntries(fields.map((f) => [f.label, f.value]));
    expect(byLabel['Name']).toBe('SharePoint Ref');
    expect(byLabel['Connection']).toBe('conn-123');
    expect(byLabel['Solutions']).toEqual(['Sol One']);
    expect(byLabel['Flows Using It']).toEqual(['Flow A', 'Flow B']);
  });

  it('shows empty indications when a reference has no connection/flows', async () => {
    setConnRefIndex({
      flowsByLogical: new Map(),
      solutionsByRef: new Map(),
      connectionsByConnector: new Map(),
    });
    const bare: ListItem = { id: 'r2', primaryText: 'Bare', searchText: 'Bare', raw: {} };
    const fields = await connRefDetails(bare);
    const connection = fields.find((f) => f.label === 'Connection');
    const flows = fields.find((f) => f.label === 'Flows Using It');
    expect(connection?.value).toBe('');
    expect(flows?.value).toEqual([]);
  });
});
