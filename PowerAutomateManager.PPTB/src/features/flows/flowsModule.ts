import {
  loadConnectionReferenceIndex,
  loadFlows,
  loadSolutionMembership,
} from './flowQueries';
import * as dv from '../../services/dataverseClient';
import { setFlowIndex, str } from './flowState';
import { flowDetails } from './flowDetails';
import { flowRowStyle } from './flowRowStyle';
import { flowGroupingOptions } from './flowGrouping';
import { flowFilters } from './flowFilters';
import { flowActions } from './flowActions';
import type { CategoryModule, ListItem, LoadContext } from '../../models/types';

export const flowsModule: CategoryModule = {
  id: 'flows',
  label: 'Flows',

  async loadItems(ctx: LoadContext): Promise<ListItem[]> {
    const [flows, solutionsByFlow, connRefByLogical] = await Promise.all([
      loadFlows(ctx.signal),
      loadSolutionMembership(ctx.signal),
      loadConnectionReferenceIndex(ctx.signal),
    ]);
    setFlowIndex({ solutionsByFlow, connRefByLogical });

    return flows.map((record) => {
      const name = str(record, 'name');
      return {
        id: str(record, 'workflowid'),
        primaryText: name,
        searchText: name,
        raw: record,
      };
    });
  },

  getDetails: flowDetails,
  getRowStyle: flowRowStyle,

  async reloadItem(id: string): Promise<ListItem | null> {
    const record = await dv.retrieve('workflow', id, [
      'name',
      'statecode',
      'statuscode',
      'ownerid',
      'ismanaged',
    ]);
    const name = str(record, 'name');
    return { id, primaryText: name, searchText: name, raw: record };
  },

  groupingOptions: flowGroupingOptions,
  filters: flowFilters,
  toolbarActions: flowActions,
};
