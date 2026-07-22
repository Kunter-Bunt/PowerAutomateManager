# Contract: Flows Module

**Feature**: 002-flows-page | **Phase**: 1

`flowsModule` implements the shell `CategoryModule` (see 001 contracts/category-module.md) with `id: 'flows'`.

```ts
const flowsModule: CategoryModule<FlowRecord> = {
  id: 'flows',
  label: 'Flows',

  async loadItems(ctx) {
    // fetchAll workflow (category=5, type=1) with $select; batch-load solution membership + conn-ref index
    // -> ListItem[] with raw: FlowRecord, searchText: name
  },

  getRowStyle(item) {
    // statecode 1 -> {accent:'positive', badge:'On'} ; 0 -> {accent:'negative', badge:'Off'}
  },

  async getDetails(item) {
    // [Name, Owner, State, Solutions(list), Connection References Used(list)]
  },

  groupingOptions: [
    { id: 'solution', label: 'Solution', keysFor },  // one key per solution
    { id: 'state', label: 'State', keysFor },         // On / Off
    { id: 'owner', label: 'Owner', keysFor },
  ],

  filters: [
    { id: 'state', label: 'State', options: [{value:'on',label:'On'},{value:'off',label:'Off'}], predicate },
    { id: 'managed', label: 'Managed', options: [{value:'managed',label:'Managed'},{value:'unmanaged',label:'Unmanaged'}], predicate },
  ],

  toolbarActions: [
    { id: 'turn-on', label: 'Turn On', scope: 'category', enabled, run },
    { id: 'turn-off', label: 'Turn Off', scope: 'category', enabled, run },
    { id: 'change-owner', label: 'Change Owner', scope: 'category', enabled, run },   // opens user picker
    { id: 'add-to-solution', label: 'Add To Solution', scope: 'category', enabled, run }, // opens solution picker
  ],
};
```

## Action contracts

- `turn-on` / `turn-off`: `run(selection)` → `runBatched` update statecode/statuscode; returns `ActionResult` with per-flow failures. `enabled` = selection non-empty.
- `change-owner`: prompts for a target `systemuser`; if none chosen → no-op + prompt (edge case). Then `Assign` per flow, batched.
- `add-to-solution`: prompts for a target unmanaged `solution`; if none chosen → no-op + prompt. Then `AddSolutionComponent` per flow, batched.

## Rules

- `run` MUST NOT throw on partial failure; it returns `{ ok:false, failures }` (FR-043).
- All reads MUST be server-side `$select`/`$filter` + paging (Constitution III).
- Group-node selection flows through the shell `SelectionModel` (de-dup by id, FR-033).
- Row style MUST include the non-color `badge` (FR-004/FR-027).
