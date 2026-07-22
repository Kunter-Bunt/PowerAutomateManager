import { bool } from '../../lib/records';
import type { FilterControl, ListItem } from '../../models/types';

const managedFilter: FilterControl = {
  id: 'managed',
  label: 'Managed',
  options: [
    { value: 'managed', label: 'Managed' },
    { value: 'unmanaged', label: 'Unmanaged' },
  ],
  predicate: (item: ListItem, values: string[]) => {
    const isManaged = bool(item.raw as Record<string, unknown>, 'ismanaged');
    return values.includes(isManaged ? 'managed' : 'unmanaged');
  },
};

export const connRefFilters: FilterControl[] = [managedFilter];
