import { connRefIndex } from './connRefState';
import { str } from '../../lib/records';
import type { GroupingOption, ListItem } from '../../models/types';

const bySolution: GroupingOption = {
  id: 'solution',
  label: 'Solution',
  keysFor: (item: ListItem) => {
    const solutions = connRefIndex.solutionsByRef.get(item.id) ?? [];
    if (solutions.length === 0) return [{ key: '__none__', label: 'No solution' }];
    return solutions.map((s) => ({ key: s.id, label: s.name }));
  },
};

const byConnector: GroupingOption = {
  id: 'connector',
  label: 'Connector',
  keysFor: (item: ListItem) => {
    const connector = str(item.raw as Record<string, unknown>, 'connectorid') || '__none__';
    return [{ key: connector, label: connector || 'No connector' }];
  },
};

export const connRefGroupingOptions: GroupingOption[] = [bySolution, byConnector];
