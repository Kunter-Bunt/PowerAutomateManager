import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationBar } from './NavigationBar';
import { Toolbar } from './Toolbar';
import { FilterBar } from './FilterBar';
import { ObjectList, type RowClickModifiers } from './ObjectList';
import { GroupedList } from './GroupedList';
import { DetailsPanel } from './DetailsPanel';
import { PickerHost } from './PickerHost';
import { SelectionModel } from '../state/SelectionModel';
import { useCategoryData } from '../state/useCategoryData';
import { getCategory } from '../categories/registry';
import { applyTheme } from '../lib/theme';
import * as host from '../services/toolboxHost';
import type { CategoryId, GroupingOption, ListItem, LoadState, ToolbarAction } from '../models/types';
import type { Connection } from '../models/hostApi';

export function Shell(): JSX.Element {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('flows');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<Record<string, string[]>>({});
  const [grouping, setGrouping] = useState<string[]>([]);
  const [selection, setSelection] = useState<SelectionModel>(new SelectionModel());

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        applyTheme(await host.getTheme());
        setConnection(await host.getActiveConnection());
        unsubscribe = host.onHostEvent((evt) => {
          if (evt.event === 'connection:updated') {
            host.getActiveConnection().then(setConnection).catch(() => setConnection(null));
          }
        });
      } catch {
        setConnection(null);
      }
    })();
    return () => unsubscribe?.();
  }, []);

  const module = useMemo(() => getCategory(activeCategory), [activeCategory]);
  const filterControls = useMemo(() => module?.filters ?? [], [module]);
  const groupingOptions = useMemo(() => module?.groupingOptions ?? [], [module]);

  const { state, visibleItems, refresh } = useCategoryData(
    activeCategory,
    connection,
    searchTerm,
    filterControls,
    filterState,
  );

  const readyItems = useMemo<ListItem[]>(
    () => (state.status === 'ready' ? state.items : []),
    [state],
  );

  useEffect(() => {
    setSelection((current) => current.reconcile(readyItems.map((item) => item.id)));
  }, [readyItems]);

  useEffect(() => {
    setSelection(new SelectionModel());
    setSearchTerm('');
    setFilterState({});
    setGrouping([]);
  }, [connection]);

  const selectedItems = useMemo(
    () => readyItems.filter((item) => selection.has(item.id)),
    [readyItems, selection],
  );
  const selectedSingle = selection.size === 1 ? (selectedItems[0] ?? null) : null;

  const selectedGroupingOptions = useMemo<GroupingOption[]>(
    () =>
      grouping
        .map((id) => groupingOptions.find((option) => option.id === id))
        .filter((option): option is GroupingOption => Boolean(option)),
    [grouping, groupingOptions],
  );

  const handleSelectCategory = useCallback((id: CategoryId) => {
    setActiveCategory(id);
    setSearchTerm('');
    setFilterState({});
    setGrouping([]);
    setSelection(new SelectionModel());
  }, []);

  const handleRowClick = useCallback(
    (item: ListItem, modifiers: RowClickModifiers) => {
      const visibleIds = visibleItems.map((entry) => entry.id);
      setSelection((current) => {
        if (modifiers.shift) return current.selectRange(item.id, visibleIds);
        if (modifiers.ctrl) return current.toggle(item.id);
        return current.selectOne(item.id);
      });
    },
    [visibleItems],
  );

  const handleSelectAll = useCallback(() => {
    setSelection((current) => current.selectAll(visibleItems.map((item) => item.id)));
  }, [visibleItems]);

  const handleClear = useCallback(() => setSelection(new SelectionModel()), []);

  const handleRunAction = useCallback(
    async (action: ToolbarAction) => {
      if (!connection) return;
      const result = await action.run(selectedItems, { connection, refresh });
      if (result.ok) {
        await host.notify({ title: action.label, body: 'Completed successfully.', type: 'success' });
      } else {
        await host.notify({
          title: action.label,
          body: `${result.failures.length} item(s) failed.`,
          type: 'warning',
        });
      }
      refresh();
    },
    [connection, selectedItems, refresh],
  );

  return (
    <div className="pam-shell">
      <NavigationBar active={activeCategory} onSelect={handleSelectCategory} />
      <Toolbar
        selection={selectedItems}
        hasItems={visibleItems.length > 0}
        categoryActions={module?.toolbarActions ?? []}
        onRefresh={refresh}
        onSelectAll={handleSelectAll}
        onClear={handleClear}
        onRunAction={handleRunAction}
      />
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterControls}
        filterState={filterState}
        onFilterChange={(filterId, values) =>
          setFilterState((current) => ({ ...current, [filterId]: values }))
        }
        groupingOptions={groupingOptions}
        grouping={grouping}
        onGroupingChange={setGrouping}
      />
      <ListRegion
        state={state}
        visibleItems={visibleItems}
        selection={selection}
        groupingOptions={selectedGroupingOptions}
        onRowClick={handleRowClick}
        onSelectIds={(ids) => setSelection((current) => current.selectIds(ids))}
        onDeselectIds={(ids) => setSelection((current) => current.deselectIds(ids))}
        onRetry={refresh}
      />
      <DetailsPanel item={selectedSingle} selectionCount={selection.size} module={module} />
      <PickerHost />
    </div>
  );
}

interface ListRegionProps {
  state: LoadState;
  visibleItems: ListItem[];
  selection: SelectionModel;
  groupingOptions: GroupingOption[];
  onRowClick: (item: ListItem, modifiers: RowClickModifiers) => void;
  onSelectIds: (ids: string[]) => void;
  onDeselectIds: (ids: string[]) => void;
  onRetry: () => void;
}

function ListRegion({
  state,
  visibleItems,
  selection,
  groupingOptions,
  onRowClick,
  onSelectIds,
  onDeselectIds,
  onRetry,
}: ListRegionProps): JSX.Element {
  if (state.status === 'loading') {
    return <div className="pam-list pam-state">Loading…</div>;
  }
  if (state.status === 'error') {
    return (
      <div className="pam-list pam-state error">
        <p>{state.message}</p>
        <button type="button" className="pam-btn" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  if (state.status === 'empty' || visibleItems.length === 0) {
    return <div className="pam-list pam-state">No objects to display.</div>;
  }
  if (groupingOptions.length > 0) {
    return (
      <GroupedList
        items={visibleItems}
        groupingOptions={groupingOptions}
        selection={selection}
        onRowClick={onRowClick}
        onSelectIds={onSelectIds}
        onDeselectIds={onDeselectIds}
      />
    );
  }
  return <ObjectList items={visibleItems} selection={selection} onRowClick={onRowClick} />;
}
