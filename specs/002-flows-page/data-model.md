# Data Model: Flows Page

**Feature**: 002-flows-page | **Date**: 2026-07-22 | **Phase**: 1

Realizes the shell's `ListItem`/`DetailField`/`RowStyle`/grouping for the Flows category. Source: Dataverse.

## Flow (Dataverse `workflow`, category=5)

| Field | Source column | Use |
|-------|---------------|-----|
| id | `workflowid` | ListItem.id, selection, bulk-action target |
| name | `name` | ListItem.primaryText, search, detail "Name" |
| state | `statecode` (1=On, 0=Off) | RowStyle accent+badge, detail "State", grouping/filter |
| statuscode | `statuscode` | write target for Turn On/Off |
| owner | `_ownerid_value` (+ formatted name) | detail "Owner", grouping/Change Owner |
| managed | `ismanaged` | managed/unmanaged filter |
| clientdata | `clientdata` (JSON) | parse `connectionReferences` for detail "Connection References Used" |
| modifiedon | `modifiedon` | optional secondary text |

### RowStyle
- On → `{ accent: 'positive', badge: 'On' }`; Off → `{ accent: 'negative', badge: 'Off' }`.

### DetailField[] (single flow)
- Name (text), Owner (text), State (text: On/Off), Solutions (list; `emptyText: "Not in any solution"`), Connection References Used (list; `emptyText: "None"`).

## Solution membership

- `solutioncomponent` where `componenttype = 29` and `objectid = workflowid` → `solution` (`solutionid, uniquename, friendlyname, ismanaged`).
- Indexed `Map<workflowId, Solution[]>`. A flow with N solutions yields N solution group keys.

## Owner (systemuser) — Change Owner target
- Picker over `systemuser` (`systemuserid, fullname`, active). Applied via `Assign`.

## Grouping options
- **Solution**: `keysFor(flow)` → one key per solution (id+friendlyname); flows with none → a "No solution" group.
- **State**: keys `On` / `Off`.
- **Owner**: key = owner id + name.
- Up to 3 levels ("Then by"). Forest nodes carry `itemIds` (descendant flow ids).

## Filters
- **State**: options On / Off; `predicate` matches `statecode`.
- **Managed**: options Managed / Unmanaged; `predicate` matches `ismanaged`.
- Combined with the shell search (AND).

## Toolbar actions (bulk, per-flow failure reporting)
| Action | Operation | Precondition/notes |
|--------|-----------|--------------------|
| Turn On | update `{statecode:1, statuscode:2}` | managed/unauthorized → per-flow failure |
| Turn Off | update `{statecode:0, statuscode:1}` | same |
| Change Owner | `Assign` action, `Assignee=systemusers(id)` | requires target user |
| Add To Solution | `AddSolutionComponent` (ComponentType 29) | requires target solution |

## Rules
- Selection de-duplicated by `workflowid` across duplicate solution groups (single application — FR-033).
- Bulk actions run via `runBatched` (bounded concurrency, retry/backoff); return `{id, reason}[]` failures.
- After a bulk action, affected rows refresh so state/owner/solution reflect the result (FR-042).
