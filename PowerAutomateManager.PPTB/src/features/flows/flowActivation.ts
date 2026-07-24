import * as dv from '../../services/dataverseClient';
import { num, STATE_OFF, STATE_ON, STATUS_OFF, STATUS_ON } from './flowState';
import { loadDependencyEdges, topologicalOrder } from './flowDependencies';
import type { ActionContext, ActionResult, ListItem } from '../../models/types';

export interface SequentialActivationOptions {
  order?: string[];
  isInTargetState(flow: ListItem): boolean;
  activate(flow: ListItem): Promise<void>;
  onActive?(id: string): void;
  onWaiting?(id: string): void;
  onDone?(id: string): void;
}

export interface ActivationFailure {
  id: string;
  reason: string;
}

function orderFlows(flows: ListItem[], order?: string[]): ListItem[] {
  if (!order || order.length === 0) return [...flows];
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...flows].sort(
    (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

/**
 * Activates flows strictly one at a time (the platform blocks parallel requests).
 * Processes in the given order when provided, then retries the still-failing flows
 * in successive passes while each pass changes at least one flow. Stops on a
 * no-progress pass (terminates for cycles and permanently-failing flows) and
 * returns the flows that never reached the target state.
 */
export async function runSequentialRetry(
  flows: ListItem[],
  opts: SequentialActivationOptions,
): Promise<ActivationFailure[]> {
  const ordered = orderFlows(flows, opts.order);
  let pending: ListItem[] = [];
  for (const flow of ordered) {
    if (opts.isInTargetState(flow)) opts.onDone?.(flow.id);
    else pending.push(flow);
  }
  // Everything still to do starts as waiting (a clock); the one being processed
  // is promoted to active (a spinner) just before its request.
  for (const flow of pending) opts.onWaiting?.(flow.id);

  const failures = new Map<string, string>();

  for (;;) {
    let progressed = false;
    const stillPending: ListItem[] = [];
    for (const flow of pending) {
      opts.onActive?.(flow.id);
      try {
        // Sequential by design — await each request before the next.
        await opts.activate(flow);
        progressed = true;
        failures.delete(flow.id);
        opts.onDone?.(flow.id);
      } catch (error) {
        failures.set(flow.id, error instanceof Error ? error.message : String(error));
        stillPending.push(flow);
        opts.onWaiting?.(flow.id);
      }
    }
    pending = stillPending;
    if (pending.length === 0 || !progressed) break;
  }

  return [...failures].map(([id, reason]) => ({ id, reason }));
}

export async function activateFlows(
  flows: ListItem[],
  target: 'on' | 'off',
  signal: AbortSignal,
  ctx?: ActionContext,
): Promise<ActionResult> {
  const statecode = target === 'on' ? STATE_ON : STATE_OFF;
  const statuscode = target === 'on' ? STATUS_ON : STATUS_OFF;
  const byId = new Map(flows.map((flow) => [flow.id, flow]));

  const patched = (flow: ListItem): ListItem => ({
    ...flow,
    raw: { ...(flow.raw as Record<string, unknown>), statecode, statuscode },
  });

  let order: string[] | undefined;
  const ids = flows.map((flow) => flow.id);
  const edges = await loadDependencyEdges(ids, signal);
  if (edges) {
    const topo = topologicalOrder(ids, edges);
    if (topo) order = target === 'on' ? topo : [...topo].reverse();
  }

  const failures = await runSequentialRetry(flows, {
    order,
    isInTargetState: (flow) => num(flow.raw as Record<string, unknown>, 'statecode') === statecode,
    activate: (flow) => dv.update('workflow', flow.id, { statecode, statuscode }),
    onActive: (id) => ctx?.onItemStatus?.(id, 'active'),
    onWaiting: (id) => ctx?.onItemStatus?.(id, 'waiting'),
    onDone: (id) => {
      // Reflect the new state on this row immediately and clear its indicator.
      const flow = byId.get(id);
      if (flow) ctx?.onItemUpdate?.({ id, item: patched(flow) });
      ctx?.onItemStatus?.(id, 'done');
    },
  });

  // Optimistic updates for the succeeded flows (fallback / final reconciliation);
  // flow activation is eventually-consistent, so we trust the successful response.
  const failedIds = new Set(failures.map((f) => f.id));
  const updates = flows
    .filter((flow) => !failedIds.has(flow.id))
    .map((flow) => ({ id: flow.id, item: patched(flow) }));

  return failures.length === 0 ? { ok: true, updates } : { ok: false, failures, updates };
}
