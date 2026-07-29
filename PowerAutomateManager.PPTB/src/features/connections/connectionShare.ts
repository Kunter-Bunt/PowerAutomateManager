import * as pp from '../../services/powerPlatformClient';
import * as dv from '../../services/dataverseClient';
import { runBatched, type BatchFailure } from '../../lib/batch';
import { openPicker, type PickerOption } from '../../app/pickerService';
import { notify } from '../../state/notificationCenter';
import type { ActionContext, ActionResult, ListItem, ToolbarAction } from '../../models/types';

type PrincipalType = 'ServicePrincipal';

interface Principal {
  id: string;
  type: PrincipalType;
  displayName: string;
}

interface PrincipalCatalog {
  options: PickerOption[];
  byValue: Map<string, Principal>;
}

function str(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return value == null ? '' : String(value);
}

const SERVICE_PRINCIPALS_QUERY =
  'systemusers?$select=systemuserid,fullname,applicationid,azureactivedirectoryobjectid' +
  '&$filter=applicationid ne null and azureactivedirectoryobjectid ne null' +
  '&$orderby=fullname&$top=500';

function parseServicePrincipals(rows: Record<string, unknown>[]): Principal[] {
  return rows.flatMap((row) => {
    const id = str(row, 'azureactivedirectoryobjectid');
    if (!id) return [];
    return [{
      id,
      type: 'ServicePrincipal',
      displayName: str(row, 'fullname') || str(row, 'applicationid') || id,
    }];
  });
}

function connectionPermissionPath(connectionId: string, principalId: string): string {
  return `connections/${encodeURIComponent(connectionId)}/permissions/${encodeURIComponent(principalId)}?api-version=2024-10-01`;
}

const UNSUPPORTED_ROUTE_PATTERN = /does not match any known api routes/i;

function describeShareFailure(reason: string): string {
  if (UNSUPPORTED_ROUTE_PATTERN.test(reason)) {
    return `Sharing connections is not currently supported by the Power Platform API on this host (no write endpoint exists yet for connection permissions). Details: ${reason}`;
  }
  return reason;
}

async function loadPrincipals(): Promise<PrincipalCatalog> {
  const options: PickerOption[] = [];
  const byValue = new Map<string, Principal>();
  const rows = await dv.query(SERVICE_PRINCIPALS_QUERY, new AbortController().signal);
  for (const principal of parseServicePrincipals(rows)) {
    const value = `servicePrincipal:${principal.id}`;
    options.push({
      value,
      label: `Service Principal: ${principal.displayName} (${principal.id})`,
      group: 'Service Principals',
    });
    byValue.set(value, principal);
  }
  return { options, byValue };
}

async function share(selection: ListItem[], ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.connection.enabledForPowerPlatformAPI) {
    await notify({
      title: 'Share',
      body: 'Sharing connections requires the Power Platform API to be enabled for this connection (app registration + “Enabled for Power Platform”).',
      type: 'warning',
    });
    return { ok: false, failures: [{ id: selection[0].id, reason: 'Power Platform API is not enabled.' }] };
  }
  let options: PickerOption[];
  let byValue: Map<string, Principal>;
  try {
    ({ options, byValue } = await loadPrincipals());
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await notify({
      title: 'Share',
      body: `Failed to load Service Principals: ${reason}`,
      type: 'error',
    });
    return { ok: false, failures: [{ id: selection[0].id, reason }] };
  }
  const picked = await openPicker({ title: 'Share', options, multiple: true, confirmLabel: 'Share' });
  if (!picked || picked.length === 0) {
    await notify({
      title: 'Share',
      body: 'Select at least one Service Principal.',
      type: 'info',
    });
    return { ok: true };
  }
  const principals = picked
    .map((value) => byValue.get(value))
    .filter((p): p is Principal => Boolean(p));
  if (principals.length === 0) {
    await notify({
      title: 'Share',
      body: 'The selected Service Principal is no longer available. Refresh the connection permissions and try again.',
      type: 'error',
    });
    return { ok: false, failures: [{ id: selection[0].id, reason: 'No valid Service Principal was selected.' }] };
  }

  const failures: BatchFailure<ListItem>[] = await runBatched(selection, async (item) => {
    for (const principal of principals) {
      await pp.put('Connectivity', connectionPermissionPath(item.id, principal.id), {
        properties: { principal: { id: principal.id, type: principal.type }, roleName: 'CanView' },
      });
    }
  });
  return failures.length === 0
    ? { ok: true }
    : { ok: false, failures: failures.map((f) => ({ id: f.item.id, reason: describeShareFailure(f.error) })) };
}

export const connectionActions: ToolbarAction[] = [
  {
    id: 'share',
    label: 'Share',
    scope: 'category',
    enabled: (selection, ctx) =>
      selection.length > 0 && Boolean(ctx?.connection?.enabledForPowerPlatformAPI),
    run: (selection, ctx) => share(selection, ctx),
  },
];
