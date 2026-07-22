import { connRefIndex } from './connRefState';
import { str } from '../../lib/records';
import type { DetailField, ListItem } from '../../models/types';

export async function connRefDetails(item: ListItem): Promise<DetailField[]> {
  const record = item.raw as Record<string, unknown>;
  const logical = str(record, 'connectionreferencelogicalname');
  const solutions = (connRefIndex.solutionsByRef.get(item.id) ?? []).map((s) => s.name);
  const flows = connRefIndex.flowsByLogical.get(logical) ?? [];

  return [
    { label: 'Name', value: item.primaryText },
    { label: 'Connection', value: str(record, 'connectionid'), emptyText: 'No connection assigned' },
    { label: 'Solutions', value: solutions, kind: 'list', emptyText: 'Not in any solution' },
    {
      label: 'Flows Using It',
      value: flows,
      kind: 'list',
      emptyText: 'No flows use this reference',
    },
  ];
}
