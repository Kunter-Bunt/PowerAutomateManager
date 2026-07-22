import { useEffect, useMemo, useState } from 'react';
import {
  registerPickerHost,
  type PickerConfig,
  type PickerOption,
} from './pickerService';

interface ActivePicker {
  config: PickerConfig;
  resolve: (values: string[] | null) => void;
}

export function PickerHost(): JSX.Element | null {
  const [active, setActive] = useState<ActivePicker | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    registerPickerHost((config, resolve) => {
      setSelected(new Set());
      setSearch('');
      setActive({ config, resolve });
    });
    return () => registerPickerHost(null);
  }, []);

  const visibleOptions = useMemo<PickerOption[]>(() => {
    if (!active) return [];
    const term = search.trim().toLowerCase();
    if (!term) return active.config.options;
    return active.config.options.filter((o) => o.label.toLowerCase().includes(term));
  }, [active, search]);

  if (!active) return null;

  const { config, resolve } = active;
  const multiple = config.multiple ?? false;

  const toggle = (value: string): void => {
    setSelected((current) => {
      const next = new Set(multiple ? current : []);
      if (current.has(value) && multiple) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const close = (values: string[] | null): void => {
    resolve(values);
    setActive(null);
  };

  return (
    <div className="pam-modal-backdrop" role="dialog" aria-modal="true" aria-label={config.title}>
      <div className="pam-modal">
        <h2 className="pam-modal-title">{config.title}</h2>
        <input
          type="search"
          className="pam-search"
          placeholder="Search…"
          aria-label="Filter options"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="pam-modal-list">
          {visibleOptions.map((option) => (
            <label key={option.value} className="pam-modal-option">
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name="pam-picker"
                checked={selected.has(option.value)}
                onChange={() => toggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
          {visibleOptions.length === 0 && <div className="pam-state">No matches.</div>}
        </div>
        <div className="pam-modal-actions">
          <button type="button" className="pam-btn" onClick={() => close(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="pam-btn"
            disabled={selected.size === 0}
            onClick={() => close([...selected])}
          >
            {config.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
