import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CategoryId, FilterControl, ListItem, LoadState } from '../models/types';
import type { Connection } from '../models/hostApi';
import { getCategory } from '../categories/registry';
import { getCached, invalidateCached, setCached } from './categoryCache';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function matchesSearch(item: ListItem, term: string): boolean {
  return item.searchText.toLowerCase().includes(term);
}

function matchesFilters(
  item: ListItem,
  controls: FilterControl[],
  filterState: Record<string, string[]>,
): boolean {
  return controls.every((control) => {
    const values = filterState[control.id];
    if (!values || values.length === 0) return true;
    return control.predicate(item, values);
  });
}

export interface CategoryData {
  state: LoadState;
  visibleItems: ListItem[];
  refresh: () => void;
  applyItemUpdates: (updates: { id: string; item: ListItem | null }[]) => void;
}

/**
 * Loads and exposes the object list for the active category. Cancels in-flight
 * loads when the category or connection changes, and narrows the ready list by
 * the search term (client-side over the loaded, $select-limited set).
 */
export function useCategoryData(
  categoryId: CategoryId,
  connection: Connection | null,
  searchTerm: string,
  filterControls: FilterControl[],
  filterState: Record<string, string[]>,
): CategoryData {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const module = getCategory(categoryId);
    if (!connection) {
      setState({ status: 'empty' });
      return;
    }
    if (!module) {
      // No category module registered yet (shipped by features 002-004).
      setState({ status: 'empty' });
      return;
    }

    // Cache hit: show the previously loaded list immediately, no reload.
    const cached = getCached(connection.id, categoryId);
    if (cached) {
      setState(cached.length === 0 ? { status: 'empty' } : { status: 'ready', items: cached });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });

    module
      .loadItems({ connection, signal: controller.signal })
      .then((items) => {
        if (controller.signal.aborted) return;
        const decorated = items.map((item) => ({ ...item, style: module.getRowStyle?.(item) }));
        setCached(connection.id, categoryId, decorated);
        setState(
          decorated.length === 0 ? { status: 'empty' } : { status: 'ready', items: decorated },
        );
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || controller.signal.aborted) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load data.',
        });
      });

    return () => controller.abort();
  }, [categoryId, connection, reloadToken]);

  const refresh = useCallback(() => {
    if (connection) invalidateCached(connection.id, categoryId);
    setReloadToken((token) => token + 1);
  }, [connection, categoryId]);

  const applyItemUpdates = useCallback(
    (updates: { id: string; item: ListItem | null }[]) => {
      const module = getCategory(categoryId);
      setState((prev) => {
        if (prev.status !== 'ready') return prev;
        const byId = new Map(prev.items.map((i) => [i.id, i]));
        for (const update of updates) {
          if (update.item === null) byId.delete(update.id);
          else byId.set(update.id, { ...update.item, style: module?.getRowStyle?.(update.item) });
        }
        const items = [...byId.values()];
        if (connection) setCached(connection.id, categoryId, items);
        return items.length === 0 ? { status: 'empty' } : { status: 'ready', items };
      });
    },
    [connection, categoryId],
  );

  const visibleItems = useMemo(() => {
    if (state.status !== 'ready') return [];
    const term = searchTerm.trim().toLowerCase();
    return state.items.filter(
      (item) =>
        matchesFilters(item, filterControls, filterState) && (!term || matchesSearch(item, term)),
    );
  }, [state, searchTerm, filterControls, filterState]);

  return { state, visibleItems, refresh, applyItemUpdates };
}
