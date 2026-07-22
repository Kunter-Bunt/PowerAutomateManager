import { bool, num, STATE_ON } from './flowState';
import type { FilterControl, ListItem } from '../../models/types';

const stateFilter: FilterControl = {
  id: 'state',
  label: 'State',
  options: [
    { value: 'on', label: 'On' },
    { value: 'off', label: 'Off' },
  ],
  predicate: (item: ListItem, values: string[]) => {
    const isOn = num(item.raw as Record<string, unknown>, 'statecode') === STATE_ON;
    return values.includes(isOn ? 'on' : 'off');
  },
};

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

export const flowFilters: FilterControl[] = [stateFilter, managedFilter];
