export const CATEGORY_MODERN_FLOW = 5;
export const TYPE_DEFINITION = 1;
export const COMPONENTTYPE_WORKFLOW = 29;

export const STATE_ON = 1;
export const STATE_OFF = 0;
export const STATUS_ON = 2;
export const STATUS_OFF = 1;

export interface SolutionRef {
  id: string;
  name: string;
  uniqueName: string;
}

export interface FlowIndex {
  solutionsByFlow: Map<string, SolutionRef[]>;
  connRefByLogical: Map<string, string>;
}

// Shared indices populated during loadItems and read by details/grouping.
// Only one category is active at a time, so a module-scoped index is safe.
export const flowIndex: FlowIndex = {
  solutionsByFlow: new Map(),
  connRefByLogical: new Map(),
};

export function setFlowIndex(next: FlowIndex): void {
  flowIndex.solutionsByFlow = next.solutionsByFlow;
  flowIndex.connRefByLogical = next.connRefByLogical;
}

// Appends a solution membership for a flow (no-op if already present) so that
// solution grouping reflects an Add-To-Solution without a full reload.
export function addFlowSolution(flowId: string, ref: SolutionRef): void {
  const list = flowIndex.solutionsByFlow.get(flowId) ?? [];
  if (list.some((s) => s.id === ref.id)) return;
  flowIndex.solutionsByFlow.set(flowId, [...list, ref]);
}

type Rec = Record<string, unknown>;

export function str(record: Rec, key: string): string {
  const value = record[key];
  return value == null ? '' : String(value);
}

export function num(record: Rec, key: string): number | undefined {
  const value = record[key];
  if (value == null) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

export function bool(record: Rec, key: string): boolean {
  const value = record[key];
  return value === true || value === 'true' || value === 1;
}

export function formattedValue(record: Rec, key: string): string {
  const formatted = record[`${key}@OData.Community.Display.V1.FormattedValue`];
  if (formatted != null) return String(formatted);
  const value = record[key];
  return value == null ? '' : String(value);
}
