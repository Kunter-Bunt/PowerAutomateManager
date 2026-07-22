import { loadFlowClientData, parseConnectionReferenceLogicalNames } from './flowQueries';
import { flowIndex, formattedValue, num, STATE_ON } from './flowState';
import type { DetailField, ListItem } from '../../models/types';

export async function flowDetails(item: ListItem): Promise<DetailField[]> {
  const record = item.raw as Record<string, unknown>;
  const owner = formattedValue(record, '_ownerid_value');
  const state = num(record, 'statecode') === STATE_ON ? 'On' : 'Off';
  const solutions = (flowIndex.solutionsByFlow.get(item.id) ?? []).map((s) => s.name);

  let connectionReferences: string[] = [];
  try {
    const clientdata = await loadFlowClientData(item.id);
    connectionReferences = parseConnectionReferenceLogicalNames(clientdata).map(
      (logical) => flowIndex.connRefByLogical.get(logical) ?? logical,
    );
  } catch {
    connectionReferences = [];
  }

  return [
    { label: 'Name', value: item.primaryText },
    { label: 'Owner', value: owner, emptyText: 'No owner' },
    { label: 'State', value: state },
    { label: 'Solutions', value: solutions, kind: 'list', emptyText: 'Not in any solution' },
    {
      label: 'Connection References Used',
      value: connectionReferences,
      kind: 'list',
      emptyText: 'None',
    },
  ];
}
