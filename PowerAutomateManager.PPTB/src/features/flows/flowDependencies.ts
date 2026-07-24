import * as dv from '../../services/dataverseClient';
import { COMPONENTTYPE_WORKFLOW } from './flowState';

export type DependencyEdge = [requiredId: string, dependentId: string];

/**
 * Orders ids so every required id precedes its dependents (Kahn's algorithm).
 * Ignores edges whose endpoints are not both in `ids`, and self-edges.
 * Returns null when a full order cannot be formed (a cycle).
 */
export function topologicalOrder(ids: string[], edges: DependencyEdge[]): string[] | null {
  const set = new Set(ids);
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  const adjacency = new Map<string, string[]>(ids.map((id) => [id, []]));

  for (const [required, dependent] of edges) {
    if (!set.has(required) || !set.has(dependent) || required === dependent) continue;
    adjacency.get(required)!.push(dependent);
    indegree.set(dependent, (indegree.get(dependent) ?? 0) + 1);
  }

  const queue = ids.filter((id) => (indegree.get(id) ?? 0) === 0);
  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const next of adjacency.get(node) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }

  return order.length === ids.length ? order : null;
}

type Rec = Record<string, unknown>;

function asRecords(response: unknown): Rec[] {
  const root = response && typeof response === 'object' ? (response as Rec) : {};
  for (const candidate of [root['value'], root['Collection'], root['EntityCollection'], root['Dependencies']]) {
    if (Array.isArray(candidate)) return candidate as Rec[];
  }
  return [];
}

function pickGuid(record: Rec, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

function pickNum(record: Rec, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value != null) return Number(value);
  }
  return undefined;
}

/**
 * Best-effort probe of child-flow dependencies among the selected flows. Returns
 * [requiredId, dependentId] edges (both endpoints within `ids`), or null on any
 * error/unavailability so the caller falls back to the unordered retry loop.
 */
export async function loadDependencyEdges(
  ids: string[],
  signal: AbortSignal,
): Promise<DependencyEdge[] | null> {
  if (ids.length < 2) return [];
  try {
    const idSet = new Set(ids);
    const edges: DependencyEdge[] = [];
    for (const id of ids) {
      if (signal.aborted) return null;
      const response = await dv.execute({
        operationName: 'RetrieveDependentComponents',
        operationType: 'function',
        parameters: { ObjectId: id, ComponentType: COMPONENTTYPE_WORKFLOW },
      });
      for (const record of asRecords(response)) {
        const dependentId = pickGuid(record, [
          'dependentcomponentobjectid',
          '_dependentcomponentobjectid_value',
        ]);
        const dependentType = pickNum(record, ['dependentcomponenttype']);
        const sameComponentType = dependentType === undefined || dependentType === COMPONENTTYPE_WORKFLOW;
        if (dependentId && dependentId !== id && idSet.has(dependentId) && sameComponentType) {
          edges.push([id, dependentId]);
        }
      }
    }
    return edges;
  } catch {
    return null;
  }
}
