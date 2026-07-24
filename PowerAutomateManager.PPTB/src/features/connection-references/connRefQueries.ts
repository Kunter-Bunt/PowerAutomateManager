import * as dv from '../../services/dataverseClient';
import { str } from '../../lib/records';
import { isDefaultSolution } from '../../lib/solutions';
import { parseConnectionReferenceLogicalNames } from '../../lib/clientdata';
import type { SolutionRef } from './connRefState';

const CONNECTION_REFERENCE_FETCH = `
<fetch>
  <entity name="connectionreference">
    <attribute name="connectionreferenceid" />
    <attribute name="connectionreferencedisplayname" />
    <attribute name="connectionreferencelogicalname" />
    <attribute name="connectorid" />
    <attribute name="connectionid" />
    <attribute name="ismanaged" />
    <order attribute="connectionreferencedisplayname" />
  </entity>
</fetch>`;

const FLOWS_WITH_CLIENTDATA_FETCH = `
<fetch>
  <entity name="workflow">
    <attribute name="workflowid" />
    <attribute name="name" />
    <attribute name="clientdata" />
    <filter type="and">
      <condition attribute="category" operator="eq" value="5" />
      <condition attribute="type" operator="eq" value="1" />
    </filter>
  </entity>
</fetch>`;

export async function loadConnectionReferences(
  signal: AbortSignal,
): Promise<Record<string, unknown>[]> {
  return dv.fetchAll(CONNECTION_REFERENCE_FETCH, signal);
}

/** Builds logical-name -> flow display names from every flow's clientdata. */
export async function buildFlowsByLogical(signal: AbortSignal): Promise<Map<string, string[]>> {
  const flows = await dv.fetchAll(FLOWS_WITH_CLIENTDATA_FETCH, signal);
  const map = new Map<string, string[]>();
  for (const flow of flows) {
    const name = str(flow, 'name');
    for (const logical of parseConnectionReferenceLogicalNames(str(flow, 'clientdata'))) {
      const list = map.get(logical) ?? [];
      list.push(name);
      map.set(logical, list);
    }
  }
  return map;
}

/** Reads solution membership for the given reference ids (no componenttype guess needed). */
export async function buildSolutionsByRef(
  refIds: string[],
  signal: AbortSignal,
): Promise<Map<string, SolutionRef[]>> {
  const map = new Map<string, SolutionRef[]>();
  if (refIds.length === 0) return map;
  const values = refIds.map((id) => `<value>${id}</value>`).join('');
  const fetch = `
<fetch>
  <entity name="solutioncomponent">
    <attribute name="objectid" />
    <filter>
      <condition attribute="objectid" operator="in">${values}</condition>
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
  const rows = await dv.fetchAll(fetch, signal);
  for (const row of rows) {
    const refId = str(row, 'objectid');
    const solutionId = str(row, 'sol.solutionid');
    const uniqueName = str(row, 'sol.uniquename');
    if (!refId || !solutionId || isDefaultSolution(uniqueName)) continue;
    const name = str(row, 'sol.friendlyname') || uniqueName;
    const list = map.get(refId) ?? [];
    list.push({ id: solutionId, name, uniqueName });
    map.set(refId, list);
  }
  return map;
}
