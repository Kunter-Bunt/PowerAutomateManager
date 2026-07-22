import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Shell } from '../../src/app/Shell';
import { registerCategory, clearCategories } from '../../src/categories/registry';
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

const mk = (id: string, name: string): ListItem => ({
  id,
  primaryText: name,
  searchText: name,
  raw: {},
});

function fakeFlows(items: ListItem[]): CategoryModule {
  return {
    id: 'flows',
    label: 'Flows',
    loadItems: async () => items,
    getDetails: async (item) => [{ label: 'Name', value: item.primaryText }],
  };
}

beforeEach(() => {
  clearCategories();
  installHost();
});

describe('Shell', () => {
  it('loads and lists objects for the active category (US1)', async () => {
    registerCategory(fakeFlows([mk('1', 'Alpha'), mk('2', 'Beta')]));
    render(<Shell />);
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('shows an empty state when no category module is registered (FR-005)', async () => {
    render(<Shell />);
    expect(await screen.findByText('No objects to display.')).toBeInTheDocument();
  });

  it('shows details for a single selected object (US2)', async () => {
    registerCategory(fakeFlows([mk('1', 'Alpha'), mk('2', 'Beta')]));
    render(<Shell />);
    fireEvent.click(await screen.findByText('Alpha'));
    expect(await screen.findByText('Name')).toBeInTheDocument();
  });

  it('narrows the list with the search box (US5)', async () => {
    registerCategory(fakeFlows([mk('1', 'Alpha'), mk('2', 'Beta')]));
    render(<Shell />);
    await screen.findByText('Alpha');
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'alp' } });
    await waitFor(() => expect(screen.queryByText('Beta')).not.toBeInTheDocument());
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('selects all visible then clears (US4)', async () => {
    registerCategory(fakeFlows([mk('1', 'Alpha'), mk('2', 'Beta')]));
    render(<Shell />);
    await screen.findByText('Alpha');
    const clear = screen.getByRole('button', { name: 'Clear Selection' });
    expect(clear).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Select All' }));
    await waitFor(() => expect(clear).toBeEnabled());
    fireEvent.click(clear);
    await waitFor(() => expect(clear).toBeDisabled());
  });
});
