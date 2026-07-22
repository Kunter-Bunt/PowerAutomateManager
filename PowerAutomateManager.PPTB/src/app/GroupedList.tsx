import { useMemo, useState } from 'react';
import { buildForest } from '../lib/grouping';
import type { GroupingOption, GroupNode, ListItem } from '../models/types';
import type { SelectionModel } from '../state/SelectionModel';
import type { RowClickModifiers } from './ObjectList';

interface GroupedListProps {
  items: ListItem[];
  groupingOptions: GroupingOption[];
  selection: SelectionModel;
  onRowClick: (item: ListItem, modifiers: RowClickModifiers) => void;
  onSelectIds: (ids: string[]) => void;
  onDeselectIds: (ids: string[]) => void;
}

function LeafRow({
  item,
  selection,
  onRowClick,
}: {
  item: ListItem;
  selection: SelectionModel;
  onRowClick: (item: ListItem, modifiers: RowClickModifiers) => void;
}): JSX.Element {
  const accent = item.style?.accent;
  const selected = selection.has(item.id);
  return (
    <div
      role="option"
      aria-selected={selected}
      className={['pam-row', selected ? 'selected' : '', accent ? `accent-${accent}` : '']
        .filter(Boolean)
        .join(' ')}
      onClick={(event) =>
        onRowClick(item, { ctrl: event.ctrlKey || event.metaKey, shift: event.shiftKey })
      }
    >
      <span className="pam-row-primary" title={item.primaryText}>
        {item.primaryText}
      </span>
      {item.secondaryText && <span className="pam-row-secondary">{item.secondaryText}</span>}
      {item.style?.badge && (
        <span
          className={['pam-badge', accent === 'positive' ? 'positive' : accent === 'negative' ? 'negative' : '']
            .filter(Boolean)
            .join(' ')}
        >
          {item.style.badge}
        </span>
      )}
    </div>
  );
}

function GroupNodeView({
  node,
  depth,
  itemsById,
  selection,
  onRowClick,
  onSelectIds,
  onDeselectIds,
}: {
  node: GroupNode;
  depth: number;
  itemsById: Map<string, ListItem>;
  selection: SelectionModel;
  onRowClick: (item: ListItem, modifiers: RowClickModifiers) => void;
  onSelectIds: (ids: string[]) => void;
  onDeselectIds: (ids: string[]) => void;
}): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const allSelected = node.itemIds.length > 0 && node.itemIds.every((id) => selection.has(id));

  return (
    <div className="pam-group">
      <div className="pam-group-header" style={{ paddingLeft: `${depth * 16}px` }}>
        <button
          type="button"
          className="pam-group-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <input
          type="checkbox"
          aria-label={`Select all in ${node.label}`}
          checked={allSelected}
          onChange={() => (allSelected ? onDeselectIds(node.itemIds) : onSelectIds(node.itemIds))}
        />
        <span className="pam-group-label">{node.label}</span>
        <span className="pam-group-count">({node.itemIds.length})</span>
      </div>
      {expanded && (
        <div>
          {node.children.length > 0
            ? node.children.map((child) => (
                <GroupNodeView
                  key={child.key}
                  node={child}
                  depth={depth + 1}
                  itemsById={itemsById}
                  selection={selection}
                  onRowClick={onRowClick}
                  onSelectIds={onSelectIds}
                  onDeselectIds={onDeselectIds}
                />
              ))
            : node.itemIds.map((id) => {
                const item = itemsById.get(id);
                return item ? (
                  <div key={id} style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                    <LeafRow item={item} selection={selection} onRowClick={onRowClick} />
                  </div>
                ) : null;
              })}
        </div>
      )}
    </div>
  );
}

export function GroupedList({
  items,
  groupingOptions,
  selection,
  onRowClick,
  onSelectIds,
  onDeselectIds,
}: GroupedListProps): JSX.Element {
  const forest = useMemo(() => buildForest(items, groupingOptions), [items, groupingOptions]);
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  return (
    <div className="pam-list" role="tree" aria-label="Grouped objects">
      {forest.map((node) => (
        <GroupNodeView
          key={node.key}
          node={node}
          depth={0}
          itemsById={itemsById}
          selection={selection}
          onRowClick={onRowClick}
          onSelectIds={onSelectIds}
          onDeselectIds={onDeselectIds}
        />
      ))}
    </div>
  );
}
