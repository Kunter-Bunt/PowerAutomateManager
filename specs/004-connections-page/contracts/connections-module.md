# Contract: Connections Module

**Feature**: 004-connections-page | **Phase**: 1

`connectionsModule` implements the shell `CategoryModule` (001 contracts/category-module.md) with `id: 'connections'`.

```ts
const connectionsModule: CategoryModule<ConnectionRecord> = {
  id: 'connections',
  label: 'Connections',

  async loadItems(ctx) {
    // powerPlatformClient.get('Connectivity', 'connections?api-version=...') -> ListItem[]
    // if !ctx.connection.enabledForPowerPlatformAPI -> throw a typed PrerequisiteError (shell shows error state)
  },

  async getDetails(item) {
    // [Name, Owner, Flows Using It(list)]  (flows via connection -> connectionreference -> workflow index)
  },

  groupingOptions: [
    { id: 'owner', label: 'Owner', keysFor },
    { id: 'connector', label: 'Connector', keysFor },
  ],

  // no filters: only the shell search box

  toolbarActions: [
    { id: 'share', label: 'Share', scope: 'category', enabled, run },  // opens principal picker
  ],
};
```

## Share action contract

- `enabled(selection)` = selection non-empty.
- `run(selection)`:
  1. Open a Service Principal picker sourced from the environment.
  2. If no Service Principal chosen → no-op and prompt the user to select at least one target (edge case).
  3. For each selected connection × each chosen Service Principal, grant permission via `powerPlatformClient` using the Enterprise Application ID, executed through `runBatched` (bounded concurrency, 429 backoff).
  4. Return `ActionResult`: `{ ok:true }` or `{ ok:false, failures: {id, reason}[] }` — never throws on partial failure (FR-015).

## Rules

- All connection reads/writes go through `powerPlatformClient`; no direct network (Constitution II).
- Degrade gracefully to an error/empty state when the connection is not enabled for the Power Platform API.
- Group-node selection flows through the shell `SelectionModel` (de-dup, FR-007).
- Share targets MUST be Service Principals only; Teams and individual users MUST NOT be available in the picker (FR-011).
- The share request MUST use the Service Principal's Enterprise Application ID as its principal identifier (FR-016).
