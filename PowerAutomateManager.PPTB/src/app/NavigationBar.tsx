import type { CategoryId } from '../models/types';
import { NAV_ITEMS } from '../categories/registry';

interface NavigationBarProps {
  active: CategoryId;
  onSelect: (id: CategoryId) => void;
}

export function NavigationBar({ active, onSelect }: NavigationBarProps): JSX.Element {
  return (
    <nav className="pam-nav" aria-label="Object categories">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === active ? 'active' : ''}
          aria-current={item.id === active}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
