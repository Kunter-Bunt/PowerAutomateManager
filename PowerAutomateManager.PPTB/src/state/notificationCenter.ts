import * as host from '../services/toolboxHost';
import type { NotifyOptions } from '../models/hostApi';

export interface NotificationDetail {
  id: string;
  reason: string;
}

export interface NotificationRecord {
  id: string;
  timestamp: number;
  title: string;
  body: string;
  type: NotifyOptions['type'];
  details?: NotificationDetail[];
}

const MAX_HISTORY = 50;

let records: NotificationRecord[] = [];
let unread = 0;
let counter = 0;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRecords(): readonly NotificationRecord[] {
  return records;
}

export function getUnreadCount(): number {
  return unread;
}

export function markAllRead(): void {
  if (unread === 0) return;
  unread = 0;
  emit();
}

export function clearAll(): void {
  if (records.length === 0 && unread === 0) return;
  records = [];
  unread = 0;
  emit();
}

// Records the notification in history (for the bell) and forwards it to the
// host so it still surfaces as a live toast.
export async function notify(
  options: NotifyOptions,
  details?: NotificationDetail[],
): Promise<void> {
  const record: NotificationRecord = {
    id: `n${++counter}`,
    timestamp: Date.now(),
    title: options.title,
    body: options.body,
    type: options.type,
    details: details && details.length > 0 ? details : undefined,
  };
  records = [record, ...records].slice(0, MAX_HISTORY);
  unread += 1;
  emit();
  await host.notify(options);
}
