# Research: Flows Page

**Feature**: 002-flows-page | **Date**: 2026-07-22 | **Phase**: 0

Builds on 001 research. Only flow-specific decisions here.

## Decision 1 — Flow source query

**Decision**: Query Dataverse `workflow` with `category = 5` (modern cloud flow) and `type = 1` (definition), selecting `workflowid, name, statecode, statuscode, _ownerid_value, ownerid` (formatted owner name via annotations), `ismanaged, modifiedon`. Server-side `$select`/`$filter`, follow paging cookies via `dataverseClient.fetchAll`.

**Rationale**: Cloud flows are `workflow` rows with `category=5`; filtering server-side satisfies Constitution III. Formatted values give owner display names without extra round-trips.

**Alternatives considered**: Power Platform `PowerAutomate` API for listing — rejected for the list because Dataverse `workflow` gives solution/owner/managed in one place and does not require Power Platform API enablement.

## Decision 2 — State semantics & color coding

**Decision**: Interpret `statecode`: `1` = Activated (On, green) and `0` = Draft (Off, red). Provide `RowStyle { accent: 'positive'|'negative', badge: 'On'|'Off' }`. The shell resolves accent to theme-aware colors; the badge is the non-color indicator (Constitution II, FR-004/FR-027 accessibility).

**Rationale**: Matches FR-026/FR-027 and the accessibility rule that color is never the sole indicator.

**Alternatives considered**: Color-only rows — rejected (accessibility/theming).

## Decision 3 — Solutions a flow belongs to

**Decision**: Resolve solution membership via `solutioncomponent` where `componenttype = 29` (Workflow) and `objectid = workflowid`, joined to `solution` (`uniquename`, `friendlyname`, `ismanaged`). Load once and index by workflow id. When grouped by Solution, emit one `GroupKey` per solution (item appears under each — FR-031/FR-032).

**Rationale**: `solutioncomponent` is the authoritative membership link; batch-loading and indexing avoids per-row queries (Constitution III).

**Alternatives considered**: Per-flow membership queries — rejected (N+1, throttling risk).

## Decision 4 — Connection references used by a flow

**Decision**: Parse `workflow.clientdata` JSON `connectionReferences` map to obtain the logical names a flow uses, then resolve to `connectionreference` display names from a batch-loaded index (`connectionreferencelogicalname` → `connectionreferencedisplayname`). Show in details; empty indication when none.

**Rationale**: The flow definition declares its connection references by logical name in `clientdata`; resolving against a single `connectionreference` fetch avoids N+1 (Constitution III). Details-only, so parsing happens lazily on selection.

**Alternatives considered**: A direct relationship query — not reliably exposed; `clientdata` is the documented source of a flow's connection reference usage.

## Decision 5 — Turn On / Turn Off

**Decision**: Update `workflow` `statecode`/`statuscode` — On = `{ statecode: 1, statuscode: 2 }`, Off = `{ statecode: 0, statuscode: 1 }` — per selected flow via `runBatched` (bounded concurrency, 429 backoff). Managed or unauthorized flows that reject are recorded as per-flow failures without aborting the batch (FR-043).

**Rationale**: Direct state update is the supported toggle; batching satisfies Constitution III and FR-038/FR-042/FR-043.

**Alternatives considered**: One-by-one sequential writes — rejected (slow at scale). Power Platform flow API — unnecessary given Dataverse write path.

## Decision 6 — Change Owner

**Decision**: Reassign each selected flow's owner using the `Assign` action (bound to `workflow`) with `Assignee = systemusers(<id>)`, via `dataverseClient.execute`, batched. A user picker supplies the target (systemusers, sourced from the environment).

**Rationale**: `Assign` is the reliable ownership-change operation; batching + per-flow failures satisfy FR-039/FR-042/FR-043.

**Alternatives considered**: PATCH `ownerid@odata.bind` — acceptable fallback; `Assign` chosen for explicit semantics.

## Decision 7 — Add To Solution

**Decision**: Call the unbound `AddSolutionComponent` action with `{ ComponentType: 29, ComponentId: <workflowid>, SolutionUniqueName: <unique>, AddRequiredComponents: false }` per selected flow, batched. A solution picker (from `getSolutions`, unmanaged solutions) supplies the target.

**Rationale**: `AddSolutionComponent` is the documented way to add a component to a solution; batching + per-flow failures satisfy FR-040/FR-042.

**Alternatives considered**: Solution import — out of scope; single-component add is correct here.

## Decision 8 — Grouping forest & selection de-dup

**Decision**: A shared multi-level forest builder groups loaded items by the selected `GroupingOption[]` (1–3 levels, "Then by"). Group nodes carry `itemIds` (all descendants). Selecting a node routes ids into the shell `SelectionModel.selectIds`, which de-duplicates — so a flow under multiple solution groups is acted upon once (FR-030/FR-031/FR-033).

**Rationale**: Reuses the shell selection model; de-dup by id guarantees single application of bulk actions (FR-033).

**Alternatives considered**: Tree-local selection state — rejected (would double-apply across duplicate solution nodes).

## Resolved unknowns

- **On/Off statecode values** → 1/0 with statuscode 2/1 (Decision 2/5).
- **Solution membership source** → `solutioncomponent` componenttype 29 (Decision 3).
- **Connection references used** → parse `workflow.clientdata` (Decision 4).
- **Owner change / add-to-solution operations** → `Assign` / `AddSolutionComponent` (Decisions 6–7).

No open `NEEDS CLARIFICATION` items remain.
