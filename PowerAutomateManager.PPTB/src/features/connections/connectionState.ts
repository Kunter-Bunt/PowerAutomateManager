export interface ParsedConnection {
  id: string;
  displayName: string;
  connector: string;
  owner: string;
}

export interface ConnectionIndex {
  flowsByConnection: Map<string, string[]>;
}

export const connectionIndex: ConnectionIndex = {
  flowsByConnection: new Map(),
};

export function setConnectionIndex(next: ConnectionIndex): void {
  connectionIndex.flowsByConnection = next.flowsByConnection;
}
