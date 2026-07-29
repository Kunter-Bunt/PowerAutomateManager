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
    // Uses the Power Platform API when the connection is enabled for it, otherwise
    // derives the list from Dataverse connection references (works everywhere).
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

  getNotice(connection) {
    if (connection && !connection.enabledForPowerPlatformAPI) {
      return {
        level: 'warning',
        message:
          'The Power Platform API is not enabled for this connection, so connections are listed from Dataverse and Sharing is unavailable. Configure an app registration, enable “Enabled for Power Platform” on the connection, and grant the Connectivity (Connections) permission to unlock owner details and Service Principal sharing.',
        link: {
          href: 'https://docs.powerplatformtoolbox.com/tool-development/api-reference/powerplatform-api',
          label: 'See the Power Platform API docs',
        },
      };
    }
    return null;
  },
};
