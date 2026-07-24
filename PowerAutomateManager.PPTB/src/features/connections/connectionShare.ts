import * as pp from '../../services/powerPlatformClient';
import * as dv from '../../services/dataverseClient';
import { runBatched, type BatchFailure } from '../../lib/batch';
import { openPicker, type PickerOption } from '../../app/pickerService';
import * as host from '../../services/toolboxHost';
import { str } from '../../lib/records';
import type { ActionContext, ActionResult, ListItem, ToolbarAction } from '../../models/types';

type PrincipalType = 'user' | 'team' | 's2s';

interface Principal {
  id: string;
  type: PrincipalType;
}

const TYPE_LABEL: Record<PrincipalType, string> = {
  user: 'User',
  team: 'Team',
  s2s: 'S2S App',
};

interface PrincipalCatalog {
  options: PickerOption[];
  byValue: Map<string, Principal>;
}

async function loadPrincipals(): Promise<PrincipalCatalog> {
  const [users, teams] = await Promise.all([
    dv.query(
      'systemusers?$select=fullname,applicationid&$filter=isdisabled eq false&$orderby=fullname&$top=500',
      new AbortController().signal,
    ),
    dv.query('teams?$select=name&$orderby=name&$top=500', new AbortController().signal),
  ]);

  const options: PickerOption[] = [];
  const byValue = new Map<string, Principal>();
  const add = (type: PrincipalType, id: string, name: string): void => {
    if (!id) return;
    const value = `${type}:${id}`;
    options.push({ value, label: `${TYPE_LABEL[type]}: ${name || id}`, group: TYPE_LABEL[type] });
    byValue.set(value, { id, type });
  };

  for (const user of users) {
    const isApp = str(user, 'applicationid') !== '';
    add(isApp ? 's2s' : 'user', str(user, 'systemuserid'), str(user, 'fullname'));
  }
  for (const team of teams) {
    add('team', str(team, 'teamid'), str(team, 'name'));
  }

  return { options, byValue };
}

// VERIFY the Connectivity permissions path/payload against the environment (research D6 / task T015).
async function shareConnection(connectionId: string, principals: Principal[]): Promise<void> {
  await pp.post(
    'Connectivity',
    `connections/${encodeURIComponent(connectionId)}/modifyPermissions?api-version=2024-10-01`,
    {
      put: principals.map((p) => ({
        properties: { principal: { id: p.id, type: p.type }, roleName: 'CanView' },
      })),
    },
  );
}

async function share(selection: ListItem[], ctx: ActionContext): Promise<ActionResult> {
  if (!ctx.connection.enabledForPowerPlatformAPI) {
    await host.notify({
      title: 'Share',
      body: 'Sharing connections requires the Power Platform API to be enabled for this connection (app registration + “Enabled for Power Platform”).',
      type: 'warning',
    });
    return { ok: true };
  }
  const { options, byValue } = await loadPrincipals();
  const picked = await openPicker({ title: 'Share', options, multiple: true, confirmLabel: 'Share' });
  if (!picked || picked.length === 0) {
    await host.notify({
      title: 'Share',
      body: 'Select at least one user, team, or app.',
      type: 'info',
    });
    return { ok: true };
  }
  const principals = picked
    .map((value) => byValue.get(value))
    .filter((p): p is Principal => Boolean(p));

  const failures: BatchFailure<ListItem>[] = await runBatched(selection, async (item) => {
    await shareConnection(item.id, principals);
  });
  return failures.length === 0
    ? { ok: true }
    : { ok: false, failures: failures.map((f) => ({ id: f.item.id, reason: f.error })) };
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
