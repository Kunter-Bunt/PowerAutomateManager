# Research: Connection References Page

**Feature**: 003-connection-references-page | **Date**: 2026-07-22 | **Phase**: 0

Builds on 001/002 research. Only connection-reference-specific decisions here.

## Decision 1 — Connection reference source query

**Decision**: Query Dataverse `connectionreference` selecting `connectionreferenceid, connectionreferencedisplayname, connectionreferencelogicalname, connectorid, connectionid, ismanaged`. Server-side `$select`/`$filter` + paging via `dataverseClient.fetchAll`.

**Rationale**: `connectionreference` is the authoritative table; `connectorid` gates Merge, `connectionid` is the Change Connection/Merge write target. Constitution III.

**Alternatives considered**: Power Platform API — unnecessary; Dataverse holds connection references.

## Decision 2 — Details: Connection, solutions, flows using it

**Decision**:
- **Connection**: from `connectionid` (display name resolved from a connections lookup; see 004 for connection source). Empty indication when unassigned.
- **Solutions**: `solutioncomponent` for the connection-reference component type (value confirmed via metadata at implementation time) joined to `solution`; indexed by reference id. One group key per solution.
- **Flows using it**: reverse of 002 Decision 4 — build an index from `workflow.clientdata` connectionReferences logical names → flows, then look up by `connectionreferencelogicalname`.

**Rationale**: Reuses the flow↔connection-reference mapping already needed in 002; batch-loading avoids N+1 (Constitution III).

**Alternatives considered**: Per-reference flow queries — rejected (N+1).

**Note**: The exact `solutioncomponent.componenttype` value for connection references MUST be confirmed from environment metadata during implementation (query `solutioncomponent` for a known reference, or read component-type metadata). Documented as an implementation verification step, not an open spec clarification.

## Decision 3 — Grouping by Solution and Connector

**Decision**: Two `GroupingOption`s — Solution (one key per solution; multi-appearance like flows) and Connector (`connectorid`). Reuse the shared multi-level forest builder and `SelectionModel` de-dup.

**Rationale**: FR-003–008; matches the flows model so tree/subtree selection behaves identically (spec: "same subtree logic").

**Alternatives considered**: State grouping — N/A (references have no state).

## Decision 4 — Filter: managed/unmanaged only

**Decision**: A single managed/unmanaged `FilterControl` on `ismanaged`. No State filter (references have no state).

**Rationale**: FR-009; matches spec's assumption that only managed/unmanaged applies here.

## Decision 5 — Change Connection

**Decision**: Update each selected reference's `connectionid` to a chosen target connection via `dataverseClient.update`, batched. The connection picker lists connections matching the reference's connector (FR-017).

**Rationale**: Repointing a reference is a `connectionid` update; connector-matched picker prevents invalid assignments. FR-012.

**Alternatives considered**: Bulk update to one connection regardless of connector — rejected (invalid; connections are connector-specific).

## Decision 6 — Merge (same-connector gate + master connection)

**Decision**: Merge is enabled only when all selected references share one `connectorid` (else blocked with a message — FR-015). It requires choosing a master connection (filtered to that connector — FR-017). On confirm, set every selected reference's `connectionid` to the master connection via batched `update`; report per-reference failures (FR-019/FR-020).

**Rationale**: Consolidating references onto a single connection is a `connectionid` repoint constrained by connector. Keeping merge as a guarded batched repoint keeps it safe and testable.

**Alternatives considered**: Deleting redundant references and rewiring flows — deferred/out of scope (spec limits merge to consolidating onto a master connection); would risk breaking flow bindings.

## Decision 7 — Add To Solution

**Decision**: Add each selected reference to a chosen unmanaged solution via the unbound `AddSolutionComponent` action with the connection-reference component type (verified per Decision 2) and `ComponentId = connectionreferenceid`, batched.

**Rationale**: Same documented mechanism as flows (002 Decision 7) with the reference component type. FR-013.

## Resolved unknowns

- **List/write columns** → `connectionreference` fields (Decision 1).
- **Merge semantics** → guarded batched `connectionid` repoint to master (Decision 6).
- **Grouping/filter set** → Solution+Connector grouping, managed-only filter (Decisions 3–4).
- **Connection-reference solution component type** → verify from metadata at implementation (Decision 2); not a spec-level clarification.

No open `NEEDS CLARIFICATION` items remain.
