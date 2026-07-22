import type { GroupingOption, ListItem } from '../../models/types';
import type { ParsedConnection } from './connectionState';

const byOwner: GroupingOption = {
  id: 'owner',
  label: 'Owner',
  keysFor: (item: ListItem) => {
    const owner = (item.raw as ParsedConnection).owner;
    return [{ key: owner || '__none__', label: owner || 'No owner' }];
  },
};

const byConnector: GroupingOption = {
  id: 'connector',
  label: 'Connector',
  keysFor: (item: ListItem) => {
    const connector = (item.raw as ParsedConnection).connector;
    return [{ key: connector || '__none__', label: connector || 'No connector' }];
  },
};

export const connectionGroupingOptions: GroupingOption[] = [byOwner, byConnector];
