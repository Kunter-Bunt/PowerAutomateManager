import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ListItem } from '../models/types';
import type { SelectionModel } from '../state/SelectionModel';

export interface RowClickModifiers {
  ctrl: boolean;
  shift: boolean;
}

interface ObjectListProps {
  items: ListItem[];
  selection: SelectionModel;
  onRowClick: (item: ListItem, modifiers: RowClickModifiers) => void;
}

const ROW_HEIGHT = 33;

export function ObjectList({ items, selection, onRowClick }: ObjectListProps): JSX.Element {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    initialRect: { width: 320, height: 640 },
  });

  return (
    <div className="pam-list" ref={parentRef} role="listbox" aria-multiselectable="true">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          const accent = item.style?.accent;
          const selected = selection.has(item.id);
          return (
            <div
              key={item.id}
              role="option"
              aria-selected={selected}
              className={[
                'pam-row',
                selected ? 'selected' : '',
                accent ? `accent-${accent}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${ROW_HEIGHT}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={(event) =>
                onRowClick(item, {
                  ctrl: event.ctrlKey || event.metaKey,
                  shift: event.shiftKey,
                })
              }
            >
              <span className="pam-row-primary" title={item.primaryText}>
                {item.primaryText}
              </span>
              {item.secondaryText && (
                <span className="pam-row-secondary">{item.secondaryText}</span>
              )}
              {item.style?.badge && (
                <span
                  className={['pam-badge', accent === 'positive' ? 'positive' : '', accent === 'negative' ? 'negative' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.style.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
