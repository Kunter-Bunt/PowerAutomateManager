import { buildFlowsByConnection, loadConnections } from './connectionQueries';
import { setConnectionIndex } from './connectionState';
import { connectionDetails } from './connectionDetails';
import { connectionGroupingOptions } from './connectionGrouping';
import { connectionActions } from './connectionShare';
import type { CategoryModule, ListItem, LoadContext } from '../../models/types';

export const connectionsModule: CategoryModule = {
  id: 'connections',
  label: 'Connections',

  async loadItems(ctx: LoadContext): Promise<ListItem[]> {
    // Throws a descriptive error when the connection is not enabled for the
    // Power Platform API; the shell renders it as a retryable error state.
    const connections = await loadConnections(ctx.connection, ctx.signal);
    const flowsByConnection = await buildFlowsByConnection(ctx.signal);
    setConnectionIndex({ flowsByConnection });

    return connections.map((connection) => ({
      id: connection.id,
      primaryText: connection.displayName,
      secondaryText: connection.connector,
      searchText: connection.displayName,
      raw: connection,
    }));
  },

  getDetails: connectionDetails,
  groupingOptions: connectionGroupingOptions,
  toolbarActions: connectionActions,
};
