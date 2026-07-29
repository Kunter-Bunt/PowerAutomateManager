# Contract: Host Adapters

**Feature**: 001-power-automate-manager | **Phase**: 1

Thin, typed wrappers over the PPTB host globals. UI and category modules use only these; no component calls `window.*` directly (Constitution II). Types are illustrative.

## toolboxHost.ts — wraps `window.toolboxAPI`

```ts
getActiveConnection(): Promise<Connection | null>;      // connections.getActiveConnection()
onHostEvent(handler: (evt: HostEvent) => void): Unsubscribe; // events.on(...)
notify(opts: NotifyOptions): Promise<void>;             // utils.showNotification
copy(text: string): Promise<void>;                      // utils.copyToClipboard
getTheme(): Promise<'light' | 'dark'>;                  // utils.getCurrentTheme
parallel<T>(...p: Promise<T>[]): Promise<T[]>;          // utils.executeParallel
getSetting<T>(key: string): Promise<T | undefined>;     // settings
setSetting<T>(key: string, value: T): Promise<void>;    // settings
```

Rules: connection is read-only; the tool never manages auth. `notify` is the only user-feedback channel. React to `connection:updated` by re-initializing data.

## dataverseClient.ts — wraps `window.dataverseAPI`

```ts
fetchAll(fetchXml: string, signal: AbortSignal): Promise<Record<string, unknown>[]>; // fetchXmlQuery + follow paging cookie
query(odata: string, signal: AbortSignal): Promise<Record<string, unknown>[]>;       // queryData
retrieve(entity: string, id: string, columns: string[]): Promise<Record<string, unknown>>;
update(entity: string, id: string, record: Record<string, unknown>): Promise<void>;
updateMany(entity: string, records: Record<string, unknown>[]): Promise<void>;       // updateMultiple
execute(req: ExecuteRequest): Promise<Record<string, unknown>>;                      // actions/functions
getSolutions(columns: string[]): Promise<Record<string, unknown>[]>;
```

Rules: all reads use `$select`/`$filter`/`$top` (no whole-table fetches); `fetchAll` transparently follows paging cookies and aborts on `signal`. Write helpers (`update*`, `execute`) are consumed by category bulk actions (002–004).

## powerPlatformClient.ts — wraps `window.powerplatformAPI`

```ts
get(ns: PpNamespace, path: string, signal?: AbortSignal): Promise<PowerPlatformResponse>;
post(ns: PpNamespace, path: string, body: unknown): Promise<PowerPlatformResponse>;
// ns e.g. 'Connectivity' | 'PowerAppsAdmin' | 'PowerAutomate' | 'UserManagement'
```

Rules: used for Power Platform service data not available in Dataverse (notably Connections in feature 004). Requires the connection to be enabled for Power Platform API; callers MUST degrade gracefully (empty/error state) when `connection.enabledForPowerPlatformAPI` is false.

## lib/batch.ts — bounded-concurrency writes with retry/backoff

```ts
runBatched<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  opts?: { concurrency?: number; retries?: number; backoffMs?: number }
): Promise<{ id: T; error: string }[]>; // returns per-item failures; never rejects on partial failure
```

Rules: default bounded concurrency; retry with exponential backoff on throttling (HTTP 429). Used by all bulk actions in 002–004 (Constitution III).
