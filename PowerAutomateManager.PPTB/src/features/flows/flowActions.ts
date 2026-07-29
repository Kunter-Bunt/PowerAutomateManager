import * as dv from '../../services/dataverseClient';
import { runBatched, type BatchFailure } from '../../lib/batch';
import { openPicker, type PickerOption } from '../../app/pickerService';
import { notify } from '../../state/notificationCenter';
import { COMPONENTTYPE_WORKFLOW, addFlowSolution, str, type SolutionRef } from './flowState';
import { activateFlows } from './flowActivation';
import type { ActionResult, ListItem, ToolbarAction } from '../../models/types';

function toResult(failures: BatchFailure<ListItem>[]): ActionResult {
  if (failures.length === 0) return { ok: true };
  return { ok: false, failures: failures.map((f) => ({ id: f.item.id, reason: f.error })) };
}

async function loadUsers(): Promise<PickerOption[]> {
  const rows = await dv.query(
    'systemusers?$select=fullname&$filter=isdisabled eq false&$orderby=fullname&$top=500',
    new AbortController().signal,
  );
  return rows.map((r) => ({
    value: str(r, 'systemuserid'),
    label: str(r, 'fullname') || str(r, 'systemuserid'),
  }));
}

async function loadUnmanagedSolutions(): Promise<{
  options: PickerOption[];
  byUniqueName: Map<string, SolutionRef>;
}> {
  const rows = await dv.getSolutions(['solutionid', 'uniquename', 'friendlyname', 'ismanaged']);
  const options: PickerOption[] = [];
  const byUniqueName = new Map<string, SolutionRef>();
  for (const row of rows) {
    if (row['ismanaged'] !== false) continue;
    const uniqueName = str(row, 'uniquename');
    const name = str(row, 'friendlyname') || uniqueName;
    options.push({ value: uniqueName, label: name });
    byUniqueName.set(uniqueName, { id: str(row, 'solutionid'), name, uniqueName });
  }
  return { options, byUniqueName };
}

async function changeOwner(selection: ListItem[]): Promise<ActionResult> {
  const users = await loadUsers();
  const picked = await openPicker({ title: 'Change Owner', options: users, confirmLabel: 'Assign' });
  if (!picked || picked.length === 0) {
    await notify({ title: 'Change Owner', body: 'Select a target user.', type: 'info' });
    return { ok: true };
  }
  const target = picked[0];
  const failures = await runBatched(selection, async (item) => {
    await dv.update('workflow', item.id, { 'ownerid@odata.bind': `/systemusers(${target})` });
  });
  return toResult(failures);
}

async function addToSolution(selection: ListItem[]): Promise<ActionResult> {
  const { options, byUniqueName } = await loadUnmanagedSolutions();
  const picked = await openPicker({ title: 'Add To Solution', options, confirmLabel: 'Add' });
  if (!picked || picked.length === 0) {
    await notify({ title: 'Add To Solution', body: 'Select a target solution.', type: 'info' });
    return { ok: true };
  }
  const uniqueName = picked[0];
  const failures = await runBatched(selection, async (item) => {
    await dv.execute({
      operationName: 'AddSolutionComponent',
      operationType: 'action',
      parameters: {
        ComponentType: COMPONENTTYPE_WORKFLOW,
        ComponentId: item.id,
        SolutionUniqueName: uniqueName,
        AddRequiredComponents: false,
      },
    });
  });
  // Reflect the new membership in the shared index so solution grouping updates
  // when the affected rows reload (avoids a stale “None” group until refresh).
  const ref = byUniqueName.get(uniqueName);
  if (ref) {
    const failed = new Set(failures.map((f) => f.item.id));
    for (const item of selection) {
      if (!failed.has(item.id)) addFlowSolution(item.id, ref);
    }
  }
  return toResult(failures);
}

const nonEmpty = (selection: ListItem[]): boolean => selection.length > 0;

export const flowActions: ToolbarAction[] = [
  {
    id: 'turn-on',
    label: 'Turn On',
    scope: 'category',
    enabled: nonEmpty,
    run: (selection, ctx) => activateFlows(selection, 'on', new AbortController().signal, ctx),
  },
  {
    id: 'turn-off',
    label: 'Turn Off',
    scope: 'category',
    enabled: nonEmpty,
    run: (selection, ctx) => activateFlows(selection, 'off', new AbortController().signal, ctx),
  },
  {
    id: 'change-owner',
    label: 'Change Owner',
    scope: 'category',
    enabled: nonEmpty,
    run: (selection) => changeOwner(selection),
  },
  {
    id: 'add-to-solution',
    label: 'Add To Solution',
    scope: 'category',
    enabled: nonEmpty,
    run: (selection) => addToSolution(selection),
  },
];
