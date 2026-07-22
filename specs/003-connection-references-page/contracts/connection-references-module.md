# Contract: Connection References Module

**Feature**: 003-connection-references-page | **Phase**: 1

`connectionReferencesModule` implements the shell `CategoryModule` (001 contracts/category-module.md) with `id: 'connection-references'`.

```ts
const connectionReferencesModule: CategoryModule<ConnRefRecord> = {
  id: 'connection-references',
  label: 'Connection References',

  async loadItems(ctx) {
    // fetchAll connectionreference with $select; batch-load solution membership + flows-using index
  },

  async getDetails(item) {
    // [Name, Connection, Solutions(list), Flows Using It(list)]
  },

  groupingOptions: [
    { id: 'solution', label: 'Solution', keysFor },   // one key per solution
    { id: 'connector', label: 'Connector', keysFor },
  ],

  filters: [
    { id: 'managed', label: 'Managed',
      options: [{value:'managed',label:'Managed'},{value:'unmanaged',label:'Unmanaged'}], predicate },
  ],

  toolbarActions: [
    { id: 'change-connection', label: 'Change Connection', scope: 'category', enabled, run }, // connector-filtered picker
    { id: 'add-to-solution', label: 'Add To Solution', scope: 'category', enabled, run },
    { id: 'merge', label: 'Merge', scope: 'category', enabled: sameConnectorGate, run },       // master-connection picker
  ],
};
```

## Action contracts

- `change-connection`: prompts for a target connection filtered to the reference's connector; if none chosen → no-op + prompt. Then `update connectionid` per reference, batched.
- `add-to-solution`: prompts for a target unmanaged solution; if none chosen → no-op + prompt. Then `AddSolutionComponent` per reference, batched.
- `merge`:
  - `enabled(selection)` = selection non-empty AND `distinctConnectors(selection).length === 1`.
  - On invoke with mixed connectors (defensive), returns blocked result with message "All selected references must use the same connector" (FR-015).
  - Prompts for a master connection filtered to the shared connector; if none chosen → no-op + prompt.
  - Sets `connectionid = master` for every selected reference via `runBatched`; returns per-reference failures.

## Rules

- `run` MUST NOT throw on partial failure; returns `{ ok:false, failures }` (FR-020).
- Reads MUST be server-side `$select`/`$filter` + paging (Constitution III).
- Group-node selection flows through the shell `SelectionModel` (de-dup, FR-010).
- Merge/Change Connection pickers MUST be filtered to the relevant connector (FR-017).
