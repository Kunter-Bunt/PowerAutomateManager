import * as dv from '../../services/dataverseClient';
import { isDefaultSolution } from '../../lib/solutions';
import { str, type SolutionRef } from './flowState';

const FLOW_FETCH = `
<fetch>
  <entity name="workflow">
    <attribute name="workflowid" />
    <attribute name="name" />
    <attribute name="statecode" />
    <attribute name="statuscode" />
    <attribute name="ownerid" />
    <attribute name="ismanaged" />
    <attribute name="modifiedon" />
    <filter type="and">
      <condition attribute="category" operator="eq" value="5" />
      <condition attribute="type" operator="eq" value="1" />
    </filter>
    <order attribute="name" />
  </entity>
</fetch>`;

const SOLUTION_MEMBERSHIP_FETCH = `
<fetch>
  <entity name="solutioncomponent">
    <attribute name="objectid" />
    <filter>
      <condition attribute="componenttype" operator="eq" value="29" />
    </filter>
    <link-entity name="solution" from="solutionid" to="solutionid" alias="sol">
      <attribute name="solutionid" />
      <attribute name="uniquename" />
      <attribute name="friendlyname" />
      <filter>
        <condition attribute="isvisible" operator="eq" value="1" />
      </filter>
    </link-entity>
  </entity>
</fetch>`;

const CONNECTION_REFERENCE_FETCH = `
<fetch>
  <entity name="connectionreference">
    <attribute name="connectionreferenceid" />
    <attribute name="connectionreferencelogicalname" />
    <attribute name="connectionreferencedisplayname" />
  </entity>
</fetch>`;

export async function loadFlows(signal: AbortSignal): Promise<Record<string, unknown>[]> {
  return dv.fetchAll(FLOW_FETCH, signal);
}

export async function loadSolutionMembership(
  signal: AbortSignal,
): Promise<Map<string, SolutionRef[]>> {
  const rows = await dv.fetchAll(SOLUTION_MEMBERSHIP_FETCH, signal);
  const map = new Map<string, SolutionRef[]>();
  for (const row of rows) {
    const flowId = str(row, 'objectid');
    const solutionId = str(row, 'sol.solutionid');
    const uniqueName = str(row, 'sol.uniquename');
    if (!flowId || !solutionId || isDefaultSolution(uniqueName)) continue;
    const name = str(row, 'sol.friendlyname') || uniqueName;
    const list = map.get(flowId) ?? [];
    list.push({ id: solutionId, name, uniqueName });
    map.set(flowId, list);
  }
  return map;
}

export async function loadConnectionReferenceIndex(
  signal: AbortSignal,
): Promise<Map<string, string>> {
  const rows = await dv.fetchAll(CONNECTION_REFERENCE_FETCH, signal);
  const map = new Map<string, string>();
  for (const row of rows) {
    const logical = str(row, 'connectionreferencelogicalname');
    if (logical) map.set(logical, str(row, 'connectionreferencedisplayname') || logical);
  }
  return map;
}

export async function loadFlowClientData(id: string): Promise<string> {
  const record = await dv.retrieve('workflow', id, ['clientdata']);
  return str(record, 'clientdata');
}

/** Extracts connection reference logical names declared in a flow's clientdata. */
export function parseConnectionReferenceLogicalNames(clientdata: string): string[] {
  if (!clientdata) return [];
  const names = new Set<string>();
  const regex = /"connectionReferenceLogicalName"\s*:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clientdata)) !== null) {
    names.add(match[1]);
  }
  return [...names];
}
