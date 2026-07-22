import {
  buildFlowsByLogical,
  buildSolutionsByRef,
  loadConnectionReferences,
} from './connRefQueries';
import {
  setConnRefIndex,
  type ConnectionOption,
} from './connRefState';
import { str } from '../../lib/records';
import { connRefDetails } from './connRefDetails';
import { connRefGroupingOptions } from './connRefGrouping';
import { connRefFilters } from './connRefFilters';
import { connRefActions } from './connRefActions';
import type { CategoryModule, ListItem, LoadContext } from '../../models/types';

function buildConnectionsByConnector(
  refs: Record<string, unknown>[],
): Map<string, ConnectionOption[]> {
  const grouped = new Map<string, Map<string, string>>();
  for (const ref of refs) {
    const connector = str(ref, 'connectorid');
    const connection = str(ref, 'connectionid');
    if (!connector || !connection) continue;
    const inner = grouped.get(connector) ?? new Map<string, string>();
    if (!inner.has(connection)) {
      inner.set(connection, str(ref, 'connectionreferencedisplayname') || connection);
    }
    grouped.set(connector, inner);
  }
  const result = new Map<string, ConnectionOption[]>();
  for (const [connector, inner] of grouped) {
    result.set(
      connector,
      [...inner].map(([value, label]) => ({ value, label })),
    );
  }
  return result;
}

export const connectionReferencesModule: CategoryModule = {
  id: 'connection-references',
  label: 'Connection References',

  async loadItems(ctx: LoadContext): Promise<ListItem[]> {
    const refs = await loadConnectionReferences(ctx.signal);
    const refIds = refs.map((r) => str(r, 'connectionreferenceid'));
    const [flowsByLogical, solutionsByRef] = await Promise.all([
      buildFlowsByLogical(ctx.signal),
      buildSolutionsByRef(refIds, ctx.signal),
    ]);
    setConnRefIndex({
      flowsByLogical,
      solutionsByRef,
      connectionsByConnector: buildConnectionsByConnector(refs),
    });

    return refs.map((record) => {
      const name =
        str(record, 'connectionreferencedisplayname') ||
        str(record, 'connectionreferencelogicalname');
      return {
        id: str(record, 'connectionreferenceid'),
        primaryText: name,
        secondaryText: str(record, 'connectorid'),
        searchText: name,
        raw: record,
      };
    });
  },

  getDetails: connRefDetails,
  groupingOptions: connRefGroupingOptions,
  filters: connRefFilters,
  toolbarActions: connRefActions,
};
