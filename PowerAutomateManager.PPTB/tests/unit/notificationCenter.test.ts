import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  notify,
  getRecords,
  getUnreadCount,
  markAllRead,
  clearAll,
  subscribe,
} from '../../src/state/notificationCenter';

let showNotification: ReturnType<typeof vi.fn>;

beforeEach(() => {
  showNotification = vi.fn().mockResolvedValue(undefined);
  (window as unknown as { toolboxAPI: unknown }).toolboxAPI = {
    utils: { showNotification },
  };
  clearAll();
});

describe('notification center', () => {
  it('records notifications and forwards them to the host', async () => {
    await notify({ title: 'Turn On', body: 'Completed successfully.', type: 'success' });
    expect(showNotification).toHaveBeenCalledWith({
      title: 'Turn On',
      body: 'Completed successfully.',
      type: 'success',
    });
    const records = getRecords();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ title: 'Turn On', type: 'success' });
  });

  it('keeps newest first and tracks unread count until read', async () => {
    await notify({ title: 'A', body: 'a', type: 'info' });
    await notify({ title: 'B', body: 'b', type: 'info' });
    expect(getRecords().map((r) => r.title)).toEqual(['B', 'A']);
    expect(getUnreadCount()).toBe(2);
    markAllRead();
    expect(getUnreadCount()).toBe(0);
  });

  it('stores failure details when provided', async () => {
    await notify({ title: 'Turn On', body: '2 item(s) failed.', type: 'warning' }, [
      { id: 'Flow A', reason: 'boom' },
      { id: 'Flow B', reason: 'nope' },
    ]);
    expect(getRecords()[0].details).toEqual([
      { id: 'Flow A', reason: 'boom' },
      { id: 'Flow B', reason: 'nope' },
    ]);
  });

  it('notifies subscribers on change', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    await notify({ title: 'A', body: 'a', type: 'info' });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
