# Data Model: Power Automate Manager (Tool Shell)

**Feature**: 001-power-automate-manager | **Date**: 2026-07-22 | **Phase**: 1

This shell defines category-agnostic UI/state models and the minimal domain identity each category exposes. Category-specific attributes and write operations are defined in features 002–004.

## UI / State entities

### CategoryId
Enumeration of the navigation items: `flows` | `connection-references` | `connections`. Selecting a `CategoryId` activates the corresponding `CategoryModule`.

### ListItem
The shell's category-agnostic row.
- `id: string` — stable unique identifier (used for selection de-dup and reconciliation).
- `primaryText: string` — main display name shown in the list and matched by search.
- `secondaryText?: string` — optional supporting text (e.g., a connector or status label).
- `searchText: string` — normalized text the search box matches against.
- `raw: unknown` — the underlying category record (typed by each module).
- `style?: RowStyle` — optional per-row styling hint provided by the module (used by 002 for state color).

### RowStyle
- `accent?: 'positive' | 'negative' | 'neutral'` — semantic accent resolved to theme-aware colors by the shell.
- `badge?: string` — optional non-color indicator text (accessibility; used with `accent`).

### DetailField
A single field rendered in the details form.
- `label: string`
- `value: string | string[]` — scalar or list (e.g., solutions, flows using it).
- `kind?: 'text' | 'list' | 'link'`
- `emptyText?: string` — shown when value is absent (distinct empty indication).

### ToolbarAction
- `id: string`
- `label: string`
- `icon?: string` — `currentColor` SVG id.
- `scope: 'common' | 'category'` — common = Refresh/Select All/Clear; category = supplied by 002–004.
- `enabled(selection): boolean`
- `run(selection, ctx): Promise<ActionResult>`

### Selection
- Ordered set of selected `ListItem.id` values plus an `anchorIndex`.
- Invariants: de-duplicated by id; empty on category change; only contains ids present in the current list after refresh (reconciled).
- Operations: `selectOne(index)`, `toggle(index)`, `selectRange(index)`, `selectIds(ids[])` (group-node), `clear()`, `selectAllVisible(items[])`.

### LoadState
Discriminated union for a category's data: `loading` | `ready(items)` | `empty` | `error(message, retry)`.

### GroupNode *(grouping is universal to the shell; the available grouping options are defined per feature 002–004)*
- `key: string`, `label: string`, `children: GroupNode[]`, `itemIds: string[]` (all items in this subtree). The shell owns the forest builder (`src/lib/grouping.ts`) and routes node selection into `Selection.selectIds`; each category module supplies its own `GroupingOption`s.

## Domain identity (minimal, per category)

The shell only needs identity + display text; full attributes live in feature data models.

### Flow (workflow) — identity
- Source: Dataverse `workflow` where `category = 5` (modern cloud flow), `type = 1`.
- `id = workflowid`, `primaryText = name`, plus `statecode` for the module's row style. (Full model: feature 002.)

### Connection Reference (connectionreference) — identity
- Source: Dataverse `connectionreference`.
- `id = connectionreferenceid`, `primaryText = connectionreferencedisplayname`, `secondaryText = connector`. (Full model: feature 003.)

### Connection — identity
- Source: Power Platform API (Connectivity namespace) via `powerplatformAPI`.
- `id = connection name/id`, `primaryText = display name`, `secondaryText = connector`. (Full model: feature 004.)

## Relationships & rules

- A `CategoryModule` maps its domain records → `ListItem[]` (server-side `$select` limited fields) and a single record → `DetailField[]`.
- Search filters `ready` items by `searchText` containment; produces `empty` when nothing matches.
- Selection resets on `CategoryId` change (FR-012) and on connection change.
- Row style and details fields are category-provided; the shell stays domain-agnostic.
