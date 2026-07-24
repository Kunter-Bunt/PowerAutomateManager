import { describe, expect, it, beforeEach, vi } from 'vitest';
import { flowDetails } from '../../src/features/flows/flowDetails';
import { setFlowIndex } from '../../src/features/flows/flowState';
import type { ListItem } from '../../src/models/types';

function installDataverse(clientdata: string): void {
  (window as unknown as { dataverseAPI: unknown }).dataverseAPI = {
    retrieve: vi.fn().mockResolvedValue({ clientdata }),
  };
}

const flow: ListItem = {
  id: 'f1',
  primaryText: 'My Flow',
  searchText: 'My Flow',
  raw: {
    statecode: 1,
    _ownerid_value: 'u1',
    '_ownerid_value@OData.Community.Display.V1.FormattedValue': 'Alice',
  },
};

beforeEach(() => {
  setFlowIndex({
    solutionsByFlow: new Map([['f1', [{ id: 'S1', name: 'Sol One', uniqueName: 'sol_one' }]]]),
    connRefByLogical: new Map([['new_sharepoint', 'SharePoint']]),
  });
});

describe('flowDetails', () => {
  it('returns name, owner, state, solutions, and resolved connection references', async () => {
    installDataverse(
      JSON.stringify({ x: { connectionReferenceLogicalName: 'new_sharepoint' } }),
    );
    const fields = await flowDetails(flow);
    const byLabel = Object.fromEntries(fields.map((f) => [f.label, f.value]));
    expect(byLabel['Name']).toBe('My Flow');
    expect(byLabel['Owner']).toBe('Alice');
    expect(byLabel['State']).toBe('On');
    expect(byLabel['Solutions']).toEqual(['Sol One']);
    expect(byLabel['Connection References Used']).toEqual(['SharePoint']);
  });

  it('returns empty connection references when clientdata has none', async () => {
    installDataverse('{}');
    const fields = await flowDetails(flow);
    const connRefs = fields.find((f) => f.label === 'Connection References Used');
    expect(connRefs?.value).toEqual([]);
  });
});
