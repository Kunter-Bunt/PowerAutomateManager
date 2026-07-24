# Contract: Sequential Activation & Dependency Ordering

**Feature**: 007-ordered-flow-activation | **Phase**: 1

## `flowDependencies.ts`

```ts
export type DependencyEdge = [requiredId: string, dependentId: string];

// Returns ids ordered so every required id precedes its dependents; null on a cycle.
export function topologicalOrder(ids: string[], edges: DependencyEdge[]): string[] | null;

// Best-effort: probes Dataverse for child-flow dependencies among the given flows.
// Returns [requiredId, dependentId] edges (both endpoints within `ids`), or null on
// any error/unavailability (caller then runs unordered + retry).
export function loadDependencyEdges(
  ids: string[],
  signal: AbortSignal,
): Promise<DependencyEdge[] | null>;
```

Rules: `topologicalOrder` ignores edges whose endpoints aren't both in `ids` and self-edges; returns `null` when a full order can't be formed (cycle). `loadDependencyEdges` never throws — it resolves `null` on failure.

## `flowActivation.ts`

```ts
export interface SequentialActivationOptions {
  order?: string[];
  isInTargetState(flow: ListItem): boolean;
  activate(flow: ListItem): Promise<void>;
}

// Pure executor: sequential, ordered-if-provided, progress-gated retry, terminates.
export async function runSequentialRetry(
  flows: ListItem[],
  opts: SequentialActivationOptions,
): Promise<{ id: string; reason: string }[]>;

// Turn On/Off entry point: derives order (dependencies for 'on', reversed for 'off'),
// then runs the executor writing workflow statecode/statuscode.
export function activateFlows(
  flows: ListItem[],
  target: 'on' | 'off',
  signal: AbortSignal,
): Promise<ActionResult>;
```

Rules:
- `runSequentialRetry` MUST await each `activate` before the next (no concurrency).
- It MUST stop when pending is empty or a pass made no progress, returning failures for flows never activated.
- `activateFlows` MUST try `loadDependencyEdges` → `topologicalOrder`; reverse for `'off'`; run the executor with `activate = update workflow statecode/statuscode`.

## `flowActions.ts`

- `turn-on.run(selection)` → `activateFlows(selection, 'on', signal)`.
- `turn-off.run(selection)` → `activateFlows(selection, 'off', signal)`.
- The parallel `runBatched` path for state changes is removed.
