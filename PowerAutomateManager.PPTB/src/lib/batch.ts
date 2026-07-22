export interface BatchOptions {
  concurrency?: number;
  retries?: number;
  backoffMs?: number;
}

export interface BatchFailure<T> {
  item: T;
  error: string;
}

function isThrottled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b429\b/.test(message) || /throttl/i.test(message) || /too many requests/i.test(message);
}

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function runWithRetry<T>(
  item: T,
  worker: (item: T) => Promise<void>,
  retries: number,
  backoffMs: number,
): Promise<void> {
  let attempt = 0;
  for (;;) {
    try {
      await worker(item);
      return;
    } catch (error) {
      if (attempt >= retries || !isThrottled(error)) throw error;
      await delay(backoffMs * 2 ** attempt);
      attempt += 1;
    }
  }
}

/**
 * Runs a write operation over many items with bounded concurrency, retrying
 * throttled (HTTP 429) attempts with exponential backoff. Never rejects on a
 * per-item failure — instead it collects and returns them, so a bulk action can
 * report partial success without aborting the batch.
 */
export async function runBatched<T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  opts: BatchOptions = {},
): Promise<BatchFailure<T>[]> {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const retries = opts.retries ?? 3;
  const backoffMs = opts.backoffMs ?? 500;

  const failures: BatchFailure<T>[] = [];
  let cursor = 0;

  async function pump(): Promise<void> {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      const item = items[index];
      try {
        await runWithRetry(item, worker, retries, backoffMs);
      } catch (error) {
        failures.push({ item, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => pump());
  await Promise.all(workers);
  return failures;
}
