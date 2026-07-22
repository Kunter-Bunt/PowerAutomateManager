import { flowIndex, formattedValue, num, str, STATE_ON } from './flowState';
import type { GroupingOption, ListItem } from '../../models/types';

const bySolution: GroupingOption = {
  id: 'solution',
  label: 'Solution',
  keysFor: (item: ListItem) => {
    const solutions = flowIndex.solutionsByFlow.get(item.id) ?? [];
    if (solutions.length === 0) return [{ key: '__none__', label: 'No solution' }];
    return solutions.map((s) => ({ key: s.id, label: s.name }));
  },
};

const byState: GroupingOption = {
  id: 'state',
  label: 'State',
  keysFor: (item: ListItem) => {
    const isOn = num(item.raw as Record<string, unknown>, 'statecode') === STATE_ON;
    return [{ key: isOn ? 'on' : 'off', label: isOn ? 'On' : 'Off' }];
  },
};

const byOwner: GroupingOption = {
  id: 'owner',
  label: 'Owner',
  keysFor: (item: ListItem) => {
    const record = item.raw as Record<string, unknown>;
    const id = str(record, '_ownerid_value') || '__none__';
    const label = formattedValue(record, '_ownerid_value') || 'No owner';
    return [{ key: id, label }];
  },
};

export const flowGroupingOptions: GroupingOption[] = [bySolution, byState, byOwner];
