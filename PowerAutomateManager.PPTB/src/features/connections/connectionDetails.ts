import { connectionIndex, type ParsedConnection } from './connectionState';
import type { DetailField, ListItem } from '../../models/types';

export async function connectionDetails(item: ListItem): Promise<DetailField[]> {
  const connection = item.raw as ParsedConnection;
  const flows = connectionIndex.flowsByConnection.get(item.id) ?? [];
  return [
    { label: 'Name', value: connection.displayName },
    { label: 'Owner', value: connection.owner, emptyText: 'No owner' },
    {
      label: 'Flows Using It',
      value: flows,
      kind: 'list',
      emptyText: 'No flows use this connection',
    },
  ];
}
