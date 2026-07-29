# Data Model: Connections Page

**Feature**: 004-connections-page | **Date**: 2026-07-22 | **Phase**: 1

Realizes the shell's `ListItem`/`DetailField`/grouping for the Connections category. Source: Power Platform API (Connectivity), cross-referenced with Dataverse for flows.

## Connection (Power Platform API resource)

| Field | Source | Use |
|-------|--------|-----|
| id | connection name/id | ListItem.id, selection, share target |
| name | display name | ListItem.primaryText, search, detail "Name" |
| connector | connector id/name | secondaryText, grouping |
| owner | creator/owner principal | detail "Owner", grouping |

### DetailField[] (single connection)
- Name (text), Owner (text), Flows Using It (list; `emptyText: "No flows use this connection"`).

## Flows using a connection (derived)
- connection → `connectionreference` (`connectionid` match) → flows (via the 002/003 `clientdata` flow index). Produces the "Flows Using It" list.

## Share Target
- Service Principal: `{ type: 'servicePrincipal', enterpriseApplicationId, displayName }`.
  - `enterpriseApplicationId` is the tenant-local Enterprise Application/service principal object ID used by the connection permissions API.
  - Users and Teams are not supported share targets.
- Sourced from the environment; the picker lists Service Principals and their display names/Enterprise Application IDs.

## Grouping options
- **Owner**: key = owner principal.
- **Connector**: key = connector.
- Up to 2 levels ("Then by"). Single owner/connector per connection → no multi-appearance duplication.

## Filters
- None. Only the shell's universal search box (FR-008).

## Toolbar action (bulk, per-connection failure reporting)
| Action | Operation | Precondition/notes |
|--------|-----------|--------------------|
| Share | grant permission to each chosen Service Principal on each selected connection (`powerplatformAPI` connection permissions), using the Enterprise Application ID, batched | requires ≥1 Service Principal; unmanageable connections → per-connection failure |

## Rules
- Selection de-duplicated by connection id (FR-007).
- Share with no Service Principal chosen → no-op + prompt (edge case).
- Share via `runBatched`; returns `{id, reason}[]`; affected rows refresh where sharing changes displayed state (FR-014).
- When `connection.enabledForPowerPlatformAPI` is false, the category shows a prerequisite error/empty state instead of a list.
