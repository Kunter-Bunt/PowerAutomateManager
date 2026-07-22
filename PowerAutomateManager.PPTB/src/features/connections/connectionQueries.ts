import * as pp from '../../services/powerPlatformClient';
import * as dv from '../../services/dataverseClient';
import { str } from '../../lib/records';
import { parseConnectionReferenceLogicalNames } from '../../lib/clientdata';
import type { Connection } from '../../models/hostApi';
import type { ParsedConnection } from './connectionState';

type Rec = Record<string, unknown>;

function rec(value: unknown): Rec {
  return value != null && typeof value === 'object' ? (value as Rec) : {};
}

function sval(value: unknown): string {
  return value == null ? '' : String(value);
}

/** Parses the Power Platform Connectivity `connections` response defensively. */
export function parseConnections(response: unknown): ParsedConnection[] {
  const root = rec(response);
  const data = rec(root['data'] ?? root);
  const value = data['value'] ?? root['value'];
  const list = Array.isArray(value) ? value : Array.isArray(response) ? (response as unknown[]) : [];

  return list.map((entry) => {
    const item = rec(entry);
    const props = rec(item['properties']);
    const createdBy = rec(props['createdBy']);
    const api = rec(props['api']);
    const id = sval(item['name'] ?? item['id']);
    return {
      id,
      displayName: sval(props['displayName'] ?? item['name'] ?? id),
      connector: sval(props['apiId'] ?? api['name'] ?? props['connectorName']),
      owner: sval(createdBy['displayName'] ?? createdBy['userPrincipalName']),
    };
  });
}

export async function loadConnections(
  connection: Connection,
  _signal: AbortSignal,
): Promise<ParsedConnection[]> {
  if (!connection.enabledForPowerPlatformAPI) {
    throw new Error(
      'This connection is not enabled for the Power Platform API. Configure an app registration and enable it in the connection settings to view Connections.',
    );
  }
  const response = await pp.get('Connectivity', 'connections?api-version=2024-10-01');
  return parseConnections(response);
}

const CONNECTION_REFERENCE_FETCH = `
<fetch>
  <entity name="connectionreference">
    <attribute name="connectionreferencelogicalname" />
    <attribute name="connectionid" />
  </entity>
</fetch>`;

const FLOWS_WITH_CLIENTDATA_FETCH = `
<fetch>
  <entity name="workflow">
    <attribute name="name" />
    <attribute name="clientdata" />
    <filter type="and">
      <condition attribute="category" operator="eq" value="5" />
      <condition attribute="type" operator="eq" value="1" />
    </filter>
  </entity>
</fetch>`;

/** Maps connection id -> flow display names, via connection references and flow clientdata. */
export async function buildFlowsByConnection(signal: AbortSignal): Promise<Map<string, string[]>> {
  const [refs, flows] = await Promise.all([
    dv.fetchAll(CONNECTION_REFERENCE_FETCH, signal),
    dv.fetchAll(FLOWS_WITH_CLIENTDATA_FETCH, signal),
  ]);

  const flowsByLogical = new Map<string, string[]>();
  for (const flow of flows) {
    const name = str(flow, 'name');
    for (const logical of parseConnectionReferenceLogicalNames(str(flow, 'clientdata'))) {
      const list = flowsByLogical.get(logical) ?? [];
      list.push(name);
      flowsByLogical.set(logical, list);
    }
  }

  const result = new Map<string, Set<string>>();
  for (const ref of refs) {
    const connectionId = str(ref, 'connectionid');
    const logical = str(ref, 'connectionreferencelogicalname');
    if (!connectionId) continue;
    const flowNames = flowsByLogical.get(logical) ?? [];
    const set = result.get(connectionId) ?? new Set<string>();
    flowNames.forEach((n) => set.add(n));
    result.set(connectionId, set);
  }

  return new Map([...result].map(([id, set]) => [id, [...set]]));
}
