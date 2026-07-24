import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Shell } from '../../src/app/Shell';
import { registerCategory, clearCategories } from '../../src/categories/registry';
import { clearCache } from '../../src/state/categoryCache';
import type { CategoryModule, ListItem, ToolbarAction } from '../../src/models/types';

function installHost(): void {
  (window as unknown as { toolboxAPI: unknown }).toolboxAPI = {
    connections: {
      getActiveConnection: vi
        .fn()
        .mockResolvedValue({ id: 'c1', name: 'Env', url: 'https://x', environment: 'Dev' }),
    },
    utils: {
      showNotification: vi.fn().mockResolvedValue(undefined),
      copyToClipboard: vi.fn().mockResolvedValue(undefined),
      getCurrentTheme: vi.fn().mockResolvedValue('light'),
    },
    settings: { get: vi.fn(), set: vi.fn() },
    events: { on: vi.fn().mockReturnValue(() => undefined) },
  };
}

const mk = (id: string, name: string): ListItem => ({ id, primaryText: name, searchText: name, raw: {} });

beforeEach(() => {
  clearCategories();
  clearCache();
  installHost();
});

describe('non-blocking operations', () => {
  it('shows a per-object spinner during an operation, keeps selection usable, then reloads only that object', async () => {
    let resolveRun: (r: { ok: true }) => void = () => undefined;
    const runP = new Promise<{ ok: true }>((r) => (resolveRun = r));
    const run = vi.fn().mockReturnValue(runP);
    const action: ToolbarAction = { id: 'act', label: 'Act', scope: 'category', enabled: (s) => s.length > 0, run };
    const reloadItem = vi.fn().mockImplementation(async (id: string) => mk(id, 'Alpha (updated)'));

    const flows: CategoryModule = {
      id: 'flows',
      label: 'Flows',
      loadItems: async () => [mk('1', 'Alpha'), mk('2', 'Beta')],
      getDetails: async () => [],
      reloadItem,
      toolbarActions: [action],
    };
    registerCategory(flows);

    render(<Shell />);
    fireEvent.click(await screen.findByText('Alpha'));
    fireEvent.click(screen.getByRole('button', { name: 'Act' }));

    // Per-object busy spinner appears while the operation runs.
    expect(await screen.findByRole('status', { name: 'Working' })).toBeInTheDocument();
    // The user can still select another object without waiting.
    fireEvent.click(screen.getByText('Beta'));

    resolveRun({ ok: true });

    await waitFor(() => expect(reloadItem).toHaveBeenCalledWith('1', expect.anything()));
    await waitFor(() => expect(screen.getByText('Alpha (updated)')).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Working' })).not.toBeInTheDocument());
  });

  it('does not start a second operation on an already-busy object', async () => {
    let resolveRun: (r: { ok: true }) => void = () => undefined;
    const runP = new Promise<{ ok: true }>((r) => (resolveRun = r));
    const run = vi.fn().mockReturnValue(runP);
    const action: ToolbarAction = { id: 'act', label: 'Act', scope: 'category', enabled: (s) => s.length > 0, run };

    const flows: CategoryModule = {
      id: 'flows',
      label: 'Flows',
      loadItems: async () => [mk('1', 'Alpha')],
      getDetails: async () => [],
      reloadItem: vi.fn().mockResolvedValue(mk('1', 'Alpha')),
      toolbarActions: [action],
    };
    registerCategory(flows);

    render(<Shell />);
    fireEvent.click(await screen.findByText('Alpha'));
    fireEvent.click(screen.getByRole('button', { name: 'Act' }));
    await screen.findByRole('status', { name: 'Working' });

    // Re-select the busy object and try again — the guard prevents a second run.
    fireEvent.click(screen.getByText('Alpha'));
    fireEvent.click(screen.getByRole('button', { name: 'Act' }));

    expect(run).toHaveBeenCalledTimes(1);
    resolveRun({ ok: true });
  });
});
