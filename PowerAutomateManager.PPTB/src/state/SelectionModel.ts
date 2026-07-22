/**
 * Immutable selection model shared by every category list. Supports plain click
 * (select one), CTRL+click (toggle), SHIFT+click (contiguous range from anchor),
 * and group-node selection (selectIds). All operations return a new instance so
 * React state updates stay predictable. Membership is de-duplicated by id.
 */
export class SelectionModel {
  private readonly selected: ReadonlySet<string>;
  private readonly anchorId: string | null;

  constructor(selected: ReadonlySet<string> = new Set(), anchorId: string | null = null) {
    this.selected = selected;
    this.anchorId = anchorId;
  }

  get ids(): string[] {
    return [...this.selected];
  }

  get size(): number {
    return this.selected.size;
  }

  has(id: string): boolean {
    return this.selected.has(id);
  }

  clear(): SelectionModel {
    return new SelectionModel();
  }

  selectOne(id: string): SelectionModel {
    return new SelectionModel(new Set([id]), id);
  }

  toggle(id: string): SelectionModel {
    const next = new Set(this.selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return new SelectionModel(next, id);
  }

  selectRange(id: string, visibleIds: string[]): SelectionModel {
    if (this.anchorId === null) return this.selectOne(id);
    const from = visibleIds.indexOf(this.anchorId);
    const to = visibleIds.indexOf(id);
    if (from < 0 || to < 0) return this.selectOne(id);
    const [lo, hi] = from < to ? [from, to] : [to, from];
    const next = new Set(this.selected);
    for (let i = lo; i <= hi; i++) next.add(visibleIds[i]);
    return new SelectionModel(next, this.anchorId);
  }

  selectIds(ids: string[]): SelectionModel {
    const next = new Set(this.selected);
    ids.forEach((id) => next.add(id));
    const anchor = ids.length > 0 ? ids[ids.length - 1] : this.anchorId;
    return new SelectionModel(next, anchor);
  }

  deselectIds(ids: string[]): SelectionModel {
    const next = new Set(this.selected);
    ids.forEach((id) => next.delete(id));
    return new SelectionModel(next, this.anchorId);
  }

  selectAll(visibleIds: string[]): SelectionModel {
    const last = visibleIds.length > 0 ? visibleIds[visibleIds.length - 1] : null;
    return new SelectionModel(new Set(visibleIds), last);
  }

  /** Drops ids no longer present (e.g. after a refresh removed rows). */
  reconcile(validIds: string[]): SelectionModel {
    const valid = new Set(validIds);
    const next = new Set([...this.selected].filter((id) => valid.has(id)));
    const anchor = this.anchorId && valid.has(this.anchorId) ? this.anchorId : null;
    return new SelectionModel(next, anchor);
  }
}
