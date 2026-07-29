import * as dv from '../../services/dataverseClient';
import { runBatched, type BatchFailure } from '../../lib/batch';
import { openPicker, type PickerOption } from '../../app/pickerService';
import { notify } from '../../state/notificationCenter';
import { str } from '../../lib/records';
import {
  COMPONENTTYPE_CONNECTION_REFERENCE,
  connRefIndex,
  type ConnectionOption,
} from './connRefState';
import type { ActionResult, ListItem, ToolbarAction } from '../../models/types';

function toResult(failures: BatchFailure<ListItem>[]): ActionResult {
  if (failures.length === 0) return { ok: true };
  return { ok: false, failures: failures.map((f) => ({ id: f.item.id, reason: f.error })) };
}

export function distinctConnectors(selection: ListItem[]): string[] {
  return [...new Set(selection.map((item) => str(item.raw as Record<string, unknown>, 'connectorid')))];
}

function connectionsForConnectors(connectors: string[]): ConnectionOption[] {
  const seen = new Set<string>();
  const options: ConnectionOption[] = [];
  for (const connector of connectors) {
    for (const option of connRefIndex.connectionsByConnector.get(connector) ?? []) {
      if (!seen.has(option.value)) {
        seen.add(option.value);
        options.push(option);
      }
    }
  }
  return options;
}

async function loadUnmanagedSolutions(): Promise<PickerOption[]> {
  const rows = await dv.getSolutions(['solutionid', 'uniquename', 'friendlyname', 'ismanaged']);
  return rows
    .filter((r) => r['ismanaged'] === false)
    .map((r) => ({
      value: str(r, 'uniquename'),
      label: str(r, 'friendlyname') || str(r, 'uniquename'),
    }));
}

async function repointToConnection(selection: ListItem[], connectionId: string): Promise<ActionResult> {
  const failures = await runBatched(selection, async (item) => {
    await dv.update('connectionreference', item.id, { connectionid: connectionId });
  });
  return toResult(failures);
}

async function changeConnection(selection: ListItem[]): Promise<ActionResult> {
  const options = connectionsForConnectors(distinctConnectors(selection));
  const picked = await openPicker({
    title: 'Change Connection',
    options,
    confirmLabel: 'Apply',
  });
  if (!picked || picked.length === 0) {
    await notify({ title: 'Change Connection', body: 'Select a target connection.', type: 'info' });
    return { ok: true };
  }
  return repointToConnection(selection, picked[0]);
}

async function merge(selection: ListItem[]): Promise<ActionResult> {
  const connectors = distinctConnectors(selection);
  if (connectors.length !== 1) {
    await notify({
      title: 'Merge',
      body: 'All selected references must use the same connector.',
      type: 'warning',
    });
    return {
      ok: false,
      failures: [
        { id: selection[0]?.id ?? '', reason: 'All selected references must use the same connector' },
      ],
    };
  }
  const options = connRefIndex.connectionsByConnector.get(connectors[0]) ?? [];
  const picked = await openPicker({
    title: 'Merge — choose master connection',
    options,
    confirmLabel: 'Merge',
  });
  if (!picked || picked.length === 0) {
    await notify({ title: 'Merge', body: 'Select a master connection.', type: 'info' });
    return { ok: true };
  }
  return repointToConnection(selection, picked[0]);
}

async function addToSolution(selection: ListItem[]): Promise<ActionResult> {
  const solutions = await loadUnmanagedSolutions();
  const picked = await openPicker({ title: 'Add To Solution', options: solutions, confirmLabel: 'Add' });
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
        ComponentType: COMPONENTTYPE_CONNECTION_REFERENCE,
        ComponentId: item.id,
        SolutionUniqueName: uniqueName,
        AddRequiredComponents: false,
      },
    });
  });
  return toResult(failures);
}

const nonEmpty = (selection: ListItem[]): boolean => selection.length > 0;

export const connRefActions: ToolbarAction[] = [
  {
    id: 'change-connection',
    label: 'Change Connection',
    scope: 'category',
    enabled: nonEmpty,
    run: (selection) => changeConnection(selection),
  },
  {
    id: 'add-to-solution',
    label: 'Add To Solution',
    scope: 'category',
    enabled: nonEmpty,
    run: (selection) => addToSolution(selection),
  },
  {
    id: 'merge',
    label: 'Merge',
    scope: 'category',
    enabled: (selection) => selection.length > 0 && distinctConnectors(selection).length === 1,
    run: (selection) => merge(selection),
  },
];
