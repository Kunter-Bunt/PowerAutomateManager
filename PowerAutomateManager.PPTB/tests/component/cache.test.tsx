import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Shell } from '../../src/app/Shell';
import { registerCategory, clearCategories } from '../../src/categories/registry';
import { clearCache } from '../../src/state/categoryCache';
import type { CategoryModule, ListItem } from '../../src/models/types';

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

function module(id: 'flows' | 'connections', label: string, load: () => Promise<ListItem[]>): CategoryModule {
  return { id, label, loadItems: load, getDetails: async () => [] };
}

beforeEach(() => {
  clearCategories();
  clearCache();
  installHost();
});

describe('loading + caching', () => {
  it('shows a spinner while loading, then the list', async () => {
    let resolveFlows: (items: ListItem[]) => void = () => undefined;
    const flowsP = new Promise<ListItem[]>((r) => (resolveFlows = r));
    registerCategory(module('flows', 'Flows', () => flowsP));

    render(<Shell />);
    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    resolveFlows([mk('1', 'Alpha')]);
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
  });

  it('serves a cached category on return without reloading', async () => {
    const flowsLoad = vi.fn().mockResolvedValue([mk('1', 'Alpha')]);
    const connLoad = vi.fn().mockResolvedValue([mk('c1', 'Conn')]);
    registerCategory(module('flows', 'Flows', flowsLoad));
    registerCategory(module('connections', 'Connections', connLoad));

    render(<Shell />);
    await screen.findByText('Alpha');
    fireEvent.click(screen.getByRole('button', { name: 'Connections' }));
    await screen.findByText('Conn');
    fireEvent.click(screen.getByRole('button', { name: 'Flows' }));
    await screen.findByText('Alpha');

    await waitFor(() => expect(flowsLoad).toHaveBeenCalledTimes(1));
  });
});
