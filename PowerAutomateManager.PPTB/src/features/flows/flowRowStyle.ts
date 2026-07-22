import { num, STATE_ON } from './flowState';
import type { ListItem, RowStyle } from '../../models/types';

export function flowRowStyle(item: ListItem): RowStyle {
  const isOn = num(item.raw as Record<string, unknown>, 'statecode') === STATE_ON;
  return isOn ? { accent: 'positive', badge: 'On' } : { accent: 'negative', badge: 'Off' };
}
