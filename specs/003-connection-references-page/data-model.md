# Data Model: Connection References Page

**Feature**: 003-connection-references-page | **Date**: 2026-07-22 | **Phase**: 1

Realizes the shell's `ListItem`/`DetailField`/grouping for the Connection References category. Source: Dataverse `connectionreference`.

## Connection Reference (Dataverse `connectionreference`)

| Field | Source column | Use |
|-------|---------------|-----|
| id | `connectionreferenceid` | ListItem.id, selection, action target |
| name | `connectionreferencedisplayname` | ListItem.primaryText, search, detail "Name" |
| logicalName | `connectionreferencelogicalname` | join key to flows using it |
| connector | `connectorid` | secondaryText, grouping, Merge gate, picker filter |
| connectionId | `connectionid` | detail "Connection", Change Connection/Merge write target |
| managed | `ismanaged` | managed/unmanaged filter |

### DetailField[] (single reference)
- Name (text), Connection (text; `emptyText: "No connection assigned"`), Solutions (list; `emptyText: "Not in any solution"`), Flows Using It (list; `emptyText: "No flows use this reference"`).

## Solution membership
- `solutioncomponent` for the connection-reference component type (value verified via metadata) joined to `solution`; `Map<connRefId, Solution[]>`. One solution group key per membership.

## Flows using a reference
- Index built from `workflow.clientdata` connectionReferences (logical name → flows), reused from 002. Looked up by `connectionreferencelogicalname`.

## Grouping options
- **Solution**: one key per solution (multi-appearance; "No solution" group for none).
- **Connector**: key = `connectorid`.
- Up to 2 levels ("Then by"). Forest nodes carry descendant reference ids.

## Filters
- **Managed**: options Managed / Unmanaged on `ismanaged`. Combined with shell search (AND). No State filter.

## Toolbar actions (bulk, per-reference failure reporting)
| Action | Operation | Precondition/notes |
|--------|-----------|--------------------|
| Change Connection | update `connectionid` = chosen connection | picker filtered to reference's connector; requires target |
| Add To Solution | `AddSolutionComponent` (connection-reference component type) | requires target unmanaged solution |
| Merge | update `connectionid` = master connection for all selected | enabled only if all selected share one `connectorid`; requires master connection (same connector) |

## Rules
- Merge `enabled` = selection non-empty AND single distinct `connectorid` across selection (FR-015).
- Merge/Change Connection pickers list only connections whose connector matches (FR-017).
- Selection de-duplicated by `connectionreferenceid` across duplicate solution groups (FR-010).
- Bulk actions via `runBatched`; return `{id, reason}[]`; affected rows refresh (FR-019).
