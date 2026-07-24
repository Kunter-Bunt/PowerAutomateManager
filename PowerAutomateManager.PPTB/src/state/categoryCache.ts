import type { CategoryId, ListItem } from '../models/types';

// In-memory, session-scoped cache of loaded objects, keyed by connection +
// category. Cleared on connection change; never persisted.
const cache = new Map<string, ListItem[]>();

function keyOf(connectionId: string, categoryId: CategoryId): string {
  return `${connectionId}:${categoryId}`;
}

export function getCached(connectionId: string, categoryId: CategoryId): ListItem[] | undefined {
  return cache.get(keyOf(connectionId, categoryId));
}

export function setCached(connectionId: string, categoryId: CategoryId, items: ListItem[]): void {
  cache.set(keyOf(connectionId, categoryId), items);
}

export function invalidateCached(connectionId: string, categoryId: CategoryId): void {
  cache.delete(keyOf(connectionId, categoryId));
}

export function clearCache(): void {
  cache.clear();
}
