import type { FilterControl, GroupingOption } from '../models/types';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: FilterControl[];
  filterState: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  groupingOptions: GroupingOption[];
  grouping: string[];
  onGroupingChange: (grouping: string[]) => void;
}

const MAX_GROUP_LEVELS = 3;

function GroupingControls({
  options,
  grouping,
  onChange,
}: {
  options: GroupingOption[];
  grouping: string[];
  onChange: (grouping: string[]) => void;
}): JSX.Element {
  const levels: JSX.Element[] = [];
  const maxLevels = Math.min(MAX_GROUP_LEVELS, options.length);
  for (let level = 0; level < maxLevels; level++) {
    if (level > 0 && grouping.length < level) break;
    const used = grouping.slice(0, level);
    const available = options.filter((o) => !used.includes(o.id));
    const value = grouping[level] ?? '';
    levels.push(
      <label key={level} className="pam-group-select">
        <span>{level === 0 ? 'Group by' : 'Then by'}</span>
        <select
          value={value}
          aria-label={level === 0 ? 'Group by' : `Then by (level ${level + 1})`}
          onChange={(e) => {
            const next = grouping.slice(0, level);
            if (e.target.value) next.push(e.target.value);
            onChange(next);
          }}
        >
          <option value="">(none)</option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>,
    );
  }
  return <>{levels}</>;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  filters,
  filterState,
  onFilterChange,
  groupingOptions,
  grouping,
  onGroupingChange,
}: FilterBarProps): JSX.Element {
  return (
    <div className="pam-filterbar">
      <input
        type="search"
        className="pam-search"
        placeholder="Search…"
        aria-label="Search"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      {filters.map((filter) => (
        <div className="pam-filter" key={filter.id}>
          <span className="pam-filter-label">{filter.label}:</span>
          {filter.options.map((option) => {
            const active = (filterState[filter.id] ?? []).includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                className={active ? 'pam-chip active' : 'pam-chip'}
                onClick={() => {
                  const current = filterState[filter.id] ?? [];
                  onFilterChange(
                    filter.id,
                    active
                      ? current.filter((v) => v !== option.value)
                      : [...current, option.value],
                  );
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ))}

      {groupingOptions.length > 0 && (
        <GroupingControls options={groupingOptions} grouping={grouping} onChange={onGroupingChange} />
      )}
    </div>
  );
}
