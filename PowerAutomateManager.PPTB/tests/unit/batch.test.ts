import { describe, expect, it } from 'vitest';
import { runBatched } from '../../src/lib/batch';

describe('runBatched', () => {
  it('returns no failures when every item succeeds', async () => {
    const done: number[] = [];
    const failures = await runBatched([1, 2, 3], async (n) => {
      done.push(n);
    });
    expect(failures).toHaveLength(0);
    expect(new Set(done)).toEqual(new Set([1, 2, 3]));
  });

  it('records per-item failures without aborting the batch', async () => {
    const failures = await runBatched(['ok1', 'bad', 'ok2'], async (item) => {
      if (item === 'bad') throw new Error('cannot modify managed item');
    });
    expect(failures).toHaveLength(1);
    expect(failures[0].item).toBe('bad');
    expect(failures[0].error).toMatch(/managed/);
  });

  it('retries throttled (429) attempts with backoff and eventually succeeds', async () => {
    let attempts = 0;
    const failures = await runBatched(
      ['x'],
      async () => {
        attempts += 1;
        if (attempts < 3) throw new Error('Request failed with status 429');
      },
      { retries: 3, backoffMs: 1 },
    );
    expect(attempts).toBe(3);
    expect(failures).toHaveLength(0);
  });

  it('gives up after exhausting retries on persistent throttling', async () => {
    const failures = await runBatched(
      ['x'],
      async () => {
        throw new Error('429 Too Many Requests');
      },
      { retries: 2, backoffMs: 1 },
    );
    expect(failures).toHaveLength(1);
  });
});
