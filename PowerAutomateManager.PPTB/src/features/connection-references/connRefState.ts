// VERIFY against environment metadata before release (research.md D2 / task T020).
// Solution component type value for a Connection Reference.
export const COMPONENTTYPE_CONNECTION_REFERENCE = 10059;

export interface SolutionRef {
  id: string;
  name: string;
  uniqueName: string;
}

export interface ConnectionOption {
  value: string;
  label: string;
}

export interface ConnRefIndex {
  flowsByLogical: Map<string, string[]>;
  solutionsByRef: Map<string, SolutionRef[]>;
  connectionsByConnector: Map<string, ConnectionOption[]>;
}

export const connRefIndex: ConnRefIndex = {
  flowsByLogical: new Map(),
  solutionsByRef: new Map(),
  connectionsByConnector: new Map(),
};

export function setConnRefIndex(next: ConnRefIndex): void {
  connRefIndex.flowsByLogical = next.flowsByLogical;
  connRefIndex.solutionsByRef = next.solutionsByRef;
  connRefIndex.connectionsByConnector = next.connectionsByConnector;
}
