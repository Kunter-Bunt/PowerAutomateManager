import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavigationBar } from './NavigationBar';
import { Toolbar } from './Toolbar';
import { FilterBar } from './FilterBar';
import { ObjectList, type RowClickModifiers } from './ObjectList';
import { GroupedList } from './GroupedList';
import { DetailsPanel } from './DetailsPanel';
import { PickerHost } from './PickerHost';
import { Spinner } from './Spinner';
import type { BusyStatus } from './RowStatus';
import { SelectionModel } from '../state/SelectionModel';
import { useCategoryData } from '../state/useCategoryData';
import { clearCache } from '../state/categoryCache';
import { getCategory } from '../categories/registry';
import { applyTheme } from '../lib/theme';
import * as host from '../services/toolboxHost';
import type {
  ActionContext,
  CategoryId,
  CategoryNotice,
  GroupingOption,
  ListItem,
  LoadState,
  ToolbarAction,
} from '../models/types';
import type { Connection } from '../models/hostApi';

export function Shell(): JSX.Element {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('flows');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<Record<string, string[]>>({});
  const [grouping, setGrouping] = useState<string[]>([]);
  const [selection, setSelection] = useState<SelectionModel>(new SelectionModel());
  const [busyStatus, setBusyStatus] = useState<Map<string, BusyStatus>>(new Map());

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

  const { state, visibleItems, refresh, applyItemUpdates } = useCategoryData(
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
    clearCache();
    setSelection(new SelectionModel());
    setBusyStatus(new Map());
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

  const notice = useMemo<CategoryNotice | null>(
    () => (module?.getNotice ? module.getNotice(connection) : null),
    [module, connection],
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

  const reloadTargets = useCallback(
    async (target: ListItem[]) => {
      if (!connection || !module?.reloadItem) return;
      const controller = new AbortController();
      const reloadItem = module.reloadItem;
      const updates = await Promise.all(
        target.map(async (item) => {
          try {
            const fresh = await reloadItem(item.id, { connection, signal: controller.signal });
            return { id: item.id, item: fresh };
          } catch {
            // Leave the row unchanged if its per-object refresh fails.
            return null;
          }
        }),
      );
      const applied = updates.filter(
        (u): u is { id: string; item: ListItem | null } => u !== null,
      );
      if (applied.length > 0) applyItemUpdates(applied);
    },
    [connection, module, applyItemUpdates],
  );

  const handleRunAction = useCallback(
    async (action: ToolbarAction) => {
      if (!connection) return;
      // Concurrency guard: never start a second operation on a busy object.
      const target = selectedItems.filter((item) => !busyStatus.has(item.id));
      if (target.length === 0) return;
      const targetIds = target.map((item) => item.id);
      // Default to active (spinner); progress-reporting actions demote queued
      // items to waiting (clock) and promote the current one to active.
      setBusyStatus((prev) => {
        const next = new Map(prev);
        targetIds.forEach((id) => next.set(id, 'active'));
        return next;
      });

      const ctx: ActionContext = {
        connection,
        refresh,
        onItemStatus: (id, status) =>
          setBusyStatus((prev) => {
            const next = new Map(prev);
            if (status === 'done') next.delete(id);
            else next.set(id, status);
            return next;
          }),
        onItemUpdate: (update) => applyItemUpdates([update]),
      };

      try {
        const result = await action.run(target, ctx);
        if (result.ok) {
          await host.notify({
            title: action.label,
            body: 'Completed successfully.',
            type: 'success',
          });
        } else {
          await host.notify({
            title: action.label,
            body: `${result.failures.length} item(s) failed.`,
            type: 'warning',
          });
        }
        // Prefer the action's optimistic updates (immediate, and avoids a stale
        // re-fetch for eventually-consistent operations like flow activation);
        // otherwise re-fetch the affected rows.
        if (result.updates && result.updates.length > 0) {
          applyItemUpdates(result.updates);
        } else {
          await reloadTargets(target);
        }
      } finally {
        setBusyStatus((prev) => {
          const next = new Map(prev);
          targetIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    },
    [connection, selectedItems, busyStatus, refresh, reloadTargets, applyItemUpdates],
  );

  return (
    <div className="pam-shell">
      <NavigationBar active={activeCategory} onSelect={handleSelectCategory} />
      <Toolbar
        selection={selectedItems}
        hasItems={visibleItems.length > 0}
        connection={connection}
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
        notice={notice}
        visibleItems={visibleItems}
        selection={selection}
        busyStatus={busyStatus}
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
  notice: CategoryNotice | null;
  visibleItems: ListItem[];
  selection: SelectionModel;
  busyStatus: ReadonlyMap<string, BusyStatus>;
  groupingOptions: GroupingOption[];
  onRowClick: (item: ListItem, modifiers: RowClickModifiers) => void;
  onSelectIds: (ids: string[]) => void;
  onDeselectIds: (ids: string[]) => void;
  onRetry: () => void;
}

function ListRegion({
  state,
  notice,
  visibleItems,
  selection,
  busyStatus,
  groupingOptions,
  onRowClick,
  onSelectIds,
  onDeselectIds,
  onRetry,
}: ListRegionProps): JSX.Element {
  let content: JSX.Element;
  if (state.status === 'loading') {
    content = (
      <div className="pam-list">
        <div className="pam-list-loading">
          <Spinner label="Loading" />
          <span>Loading…</span>
        </div>
      </div>
    );
  } else if (state.status === 'error') {
    content = (
      <div className="pam-list pam-state error">
        <p>{state.message}</p>
        <button type="button" className="pam-btn" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  } else if (state.status === 'empty' || visibleItems.length === 0) {
    content = <div className="pam-list pam-state">No objects to display.</div>;
  } else if (groupingOptions.length > 0) {
    content = (
      <GroupedList
        items={visibleItems}
        groupingOptions={groupingOptions}
        selection={selection}
        busyStatus={busyStatus}
        onRowClick={onRowClick}
        onSelectIds={onSelectIds}
        onDeselectIds={onDeselectIds}
      />
    );
  } else {
    content = (
      <ObjectList items={visibleItems} selection={selection} busyStatus={busyStatus} onRowClick={onRowClick} />
    );
  }

  return (
    <div className="pam-list-wrap">
      {notice && (
        <div className={`pam-banner pam-banner-${notice.level}`} role="status">
          {notice.message}
          {notice.link && (
            <>
              {' '}
              <a
                className="pam-banner-link"
                href={notice.link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {notice.link.label}
              </a>
            </>
          )}
        </div>
      )}
      {content}
    </div>
  );
}
