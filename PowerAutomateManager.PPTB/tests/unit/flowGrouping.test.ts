import { describe, expect, it, beforeEach } from 'vitest';
import { flowGroupingOptions } from '../../src/features/flows/flowGrouping';
import { setFlowIndex } from '../../src/features/flows/flowState';
import type { ListItem } from '../../src/models/types';

const [bySolution, byState, byOwner] = flowGroupingOptions;

function flow(id: string, statecode: number, ownerValue: string, ownerName: string): ListItem {
  return {
    id,
    primaryText: id,
    searchText: id,
    raw: {
      statecode,
      _ownerid_value: ownerValue,
      '_ownerid_value@OData.Community.Display.V1.FormattedValue': ownerName,
    },
  };
}

beforeEach(() => {
  setFlowIndex({
    solutionsByFlow: new Map([
      [
        '1',
        [
          { id: 'S1', name: 'Sol One', uniqueName: 'sol_one' },
          { id: 'S2', name: 'Sol Two', uniqueName: 'sol_two' },
        ],
      ],
    ]),
    connRefByLogical: new Map(),
  });
});

describe('flow grouping options', () => {
  it('groups by each solution the flow belongs to', () => {
    const keys = bySolution.keysFor(flow('1', 1, 'u1', 'User'));
    expect(keys.map((k) => k.key)).toEqual(['S1', 'S2']);
  });

  it('groups flows with no solution under a None bucket ordered last', () => {
    const keys = bySolution.keysFor(flow('99', 1, 'u1', 'User'));
    expect(keys).toEqual([{ key: '__none__', label: 'None', sortLast: true }]);
  });

  it('groups by On/Off state', () => {
    expect(byState.keysFor(flow('1', 1, 'u1', 'User'))[0].label).toBe('On');
    expect(byState.keysFor(flow('1', 0, 'u1', 'User'))[0].label).toBe('Off');
  });

  it('groups by owner id with a display label', () => {
    const [key] = byOwner.keysFor(flow('1', 1, 'u1', 'Alice'));
    expect(key).toEqual({ key: 'u1', label: 'Alice' });
  });
});
