import type { Connection } from './hostApi';

export type CategoryId = 'flows' | 'connection-references' | 'connections';

export type Accent = 'positive' | 'negative' | 'neutral';

export interface RowStyle {
  accent?: Accent;
  badge?: string;
}

export interface ListItem<TRecord = unknown> {
  id: string;
  primaryText: string;
  secondaryText?: string;
  searchText: string;
  raw: TRecord;
  style?: RowStyle;
}

export interface DetailField {
  label: string;
  value: string | string[];
  kind?: 'text' | 'list' | 'link';
  emptyText?: string;
}

export interface ActionContext {
  connection: Connection;
  refresh: () => void;
}

export interface ActionEnabledContext {
  connection: Connection | null;
}

export interface CategoryNotice {
  level: 'info' | 'warning' | 'error';
  message: string;
  link?: { href: string; label: string };
}

export type ActionResult =
  | { ok: true }
  | { ok: false; failures: { id: string; reason: string }[] };

export interface ToolbarAction {
  id: string;
  label: string;
  scope: 'common' | 'category';
  enabled(selection: ListItem[], ctx?: ActionEnabledContext): boolean;
  run(selection: ListItem[], ctx: ActionContext): Promise<ActionResult>;
}

export interface GroupKey {
  key: string;
  label: string;
  sortLast?: boolean;
}

export interface GroupingOption {
  id: string;
  label: string;
  keysFor(item: ListItem): GroupKey[];
}

export interface GroupNode {
  key: string;
  label: string;
  children: GroupNode[];
  itemIds: string[];
  sortLast?: boolean;
}

export interface FilterControl {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  predicate(item: ListItem, selectedValues: string[]): boolean;
}

export interface LoadContext {
  connection: Connection;
  signal: AbortSignal;
}

export interface CategoryModule<TRecord = unknown> {
  id: CategoryId;
  label: string;
  loadItems(ctx: LoadContext): Promise<ListItem<TRecord>[]>;
  getDetails(item: ListItem<TRecord>): Promise<DetailField[]>;
  getRowStyle?(item: ListItem<TRecord>): RowStyle | undefined;
  reloadItem?(id: string, ctx: LoadContext): Promise<ListItem<TRecord> | null>;
  getNotice?(connection: Connection | null): CategoryNotice | null;
  toolbarActions?: ToolbarAction[];
  groupingOptions?: GroupingOption[];
  filters?: FilterControl[];
}

export type LoadState<TRecord = unknown> =
  | { status: 'loading' }
  | { status: 'ready'; items: ListItem<TRecord>[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };
