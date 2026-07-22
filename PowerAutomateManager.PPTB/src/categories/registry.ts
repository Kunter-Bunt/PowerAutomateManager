import type { CategoryId, CategoryModule } from '../models/types';

export const NAV_ITEMS: { id: CategoryId; label: string }[] = [
  { id: 'flows', label: 'Flows' },
  { id: 'connection-references', label: 'Connection References' },
  { id: 'connections', label: 'Connections' },
];

const modules = new Map<CategoryId, CategoryModule>();

export function registerCategory(module: CategoryModule): void {
  modules.set(module.id, module);
}

export function getCategory(id: CategoryId): CategoryModule | undefined {
  return modules.get(id);
}

export function clearCategories(): void {
  modules.clear();
}
