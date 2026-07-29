# Research: Connections Page

**Feature**: 004-connections-page | **Date**: 2026-07-22 | **Phase**: 0

Builds on 001/002/003 research. Only connection-specific decisions here.

## Decision 1 — Connection source (Power Platform API)

**Decision**: List connections via `powerplatformAPI` (`Connectivity` namespace, e.g. `Connectivity.Get('connections?api-version=2024-10-01')`) through the shell `powerPlatformClient`. Map each connection to a `ListItem` (`id`, display name, connector as secondary text, owner).

**Rationale**: Modern Power Automate/Power Apps connections are Power Platform service resources, not a first-class Dataverse table; the documented access path is the namespaced `powerplatformAPI`. Constitution II mandates using the sanctioned host APIs.

**Alternatives considered**: A Dataverse `connection` table — rejected: the CRM `connection` entity models record-to-record relationships, not Power Platform API connections. Direct HTTP — prohibited (sandbox; Constitution II).

**Risk/Prerequisite**: `powerplatformAPI` requires the active connection to be enabled for Power Platform API (`Connection.enabledForPowerPlatformAPI`) with an Entra app registration configured. When disabled, the Connections category MUST show a clear error/empty state explaining the prerequisite (FR-023 from 001). This is a documented operational prerequisite, not an open spec clarification.

## Decision 2 — minAPI

**Decision**: Ensure the manifest `features.minAPI` covers `powerplatformAPI` availability. If any adopted `powerplatformAPI` method requires a version higher than the shell's `1.2.0` baseline, raise `minAPI` accordingly during implementation.

**Rationale**: Constitution II / manifest contract — `minAPI` must be the highest minimum across all host methods used.

## Decision 3 — Details: owner and flows using it

**Decision**:
- **Owner**: from the connection payload (creator/owner principal) returned by the Connectivity API.
- **Flows using it**: derive by linking connections → connection references (`connectionreference.connectionid`) → flows using those references (reuse the 002/003 `clientdata` flow index). Show display names; empty indication when none.

**Rationale**: The connection→flow relationship is indirect (connection ↔ connection reference ↔ flow); reusing the existing indexes avoids extra round-trips (Constitution III).

**Alternatives considered**: A dedicated "flows by connection" API call per connection — rejected (N+1; not guaranteed available).

## Decision 4 — Grouping by Owner and Connector

**Decision**: Two `GroupingOption`s — Owner and Connector — reusing the shared forest builder and `SelectionModel`. Up to 2 levels ("Then by"). A connection has one owner and one connector, so no multi-appearance duplication.

**Rationale**: FR-003–006; consistent tree/subtree selection with the other categories ("same subtree logic").

## Decision 5 — No category filters

**Decision**: Provide no `filters` (the shell shows only the universal search box). Connections have no State or managed/unmanaged concept in this feature.

**Rationale**: FR-008 and the spec's interpretation that Connections have no filters beyond search.

## Decision 6 — Share (Service Principals only)

**Decision**: Implement Share as a category toolbar action. The picker lets the user select one or more Service Principals sourced from the environment. Teams and individual users are excluded. Sharing grants each Service Principal access to each selected connection via the connection permissions endpoint on `powerplatformAPI` (`Connectivity`), using the Service Principal's Enterprise Application ID as the principal identifier, batched with `runBatched`; per-connection failures are reported (FR-014–015).

**Rationale**: Sharing a connection is a permission grant on the Power Platform connection resource. The supported target is the tenant-local Service Principal represented by its Enterprise Application ID; it is not a Dataverse Team or individual user. Batching + per-item failures satisfy FR-013–015 and Constitution III.

**Alternatives considered**: Dataverse `GrantAccess` action on a Dataverse record — rejected: connections are Power Platform resources, so permissions are managed through the connection permissions API, not `PrincipalObjectAccess`.

**Verification note**: The exact Connectivity permissions path/payload and Service Principal principal shape MUST be confirmed against the environment's Power Platform API during implementation; the Enterprise Application ID is the required principal identifier, and the approach (grant permission per Service Principal per connection, batched) is fixed.

## Resolved unknowns

- **Connection source** → `powerplatformAPI` Connectivity (Decision 1).
- **Owner / flows-using derivation** → payload owner + connection↔ref↔flow index (Decision 3).
- **Share mechanism & principal identity** → connection permissions grant for Service Principals, using the Enterprise Application ID, batched (Decision 6).
- **Filters** → none beyond search (Decision 5).

No open `NEEDS CLARIFICATION` items remain; two implementation-time verification notes recorded (Decisions 1, 6).
