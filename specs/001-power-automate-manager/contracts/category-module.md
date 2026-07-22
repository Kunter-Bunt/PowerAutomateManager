# Contract: CategoryModule

**Feature**: 001-power-automate-manager | **Phase**: 1

The extension point every category (002–004) implements. The shell consumes it; it never imports category code directly. Types are illustrative TypeScript.

```ts
export interface CategoryModule<TRecord = unknown> {
  id: CategoryId;                       // 'flows' | 'connection-references' | 'connections'
  label: string;                        // navigation label

  // Data: server-side query with $select/$filter/$top + paging. Cancellable.
  loadItems(ctx: LoadContext): Promise<ListItem[]>;

  // Map a single selected record to a details form.
  getDetails(item: ListItem): Promise<DetailField[]>;

  // Optional per-row styling (e.g., state color + non-color badge).
  getRowStyle?(item: ListItem): RowStyle | undefined;

  // Category-specific toolbar actions (in addition to common Refresh/SelectAll/Clear).
  toolbarActions?: ToolbarAction[];

  // Optional grouping options (label + key extractor). Absent = no grouping.
  groupingOptions?: GroupingOption[];

  // Optional filter controls (absent = only the universal search box).
  filters?: FilterControl[];
}

export interface LoadContext {
  connection: Connection;               // from toolboxAPI.connections (read-only)
  signal: AbortSignal;                  // cancellation on category/refresh change
}

export interface GroupingOption {
  id: string;                           // e.g. 'solution' | 'state' | 'owner' | 'connector'
  label: string;
  // Returns one or more group keys for an item (multiple => item appears under each, e.g. solutions).
  keysFor(item: ListItem): GroupKey[];
}

export interface GroupKey { key: string; label: string; }

export interface FilterControl {
  id: string;                           // e.g. 'state' | 'managed'
  label: string;
  options: { value: string; label: string }[];
  predicate(item: ListItem, selectedValues: string[]): boolean;
}

export type ActionResult =
  | { ok: true }
  | { ok: false; failures: { id: string; reason: string }[] };
```

## Rules

- `loadItems` MUST use server-side filtering/paging and MUST honor `ctx.signal` (Constitution III).
- `getRowStyle` returning an `accent` MUST also provide a `badge` (non-color indicator) for accessibility.
- `toolbarActions[].run` MUST return per-item failures rather than throwing for partial failure (used by 002–004 bulk actions).
- Grouping with multiple `keysFor` results places the item under each group (e.g., a flow in multiple solutions).
- The shell owns Refresh, Select All, and Clear Selection; modules MUST NOT redefine them.

## Registration

```ts
// src/categories/registry.ts
registerCategory(flowsModule);              // feature 002
registerCategory(connectionReferencesModule); // feature 003
registerCategory(connectionsModule);        // feature 004
```

The shell renders navigation and surfaces from the registry order. A missing module for a `CategoryId` yields an empty-state (not an error).
