import type { ListItem, ToolbarAction } from '../models/types';
import type { Connection } from '../models/hostApi';

interface ToolbarProps {
  selection: ListItem[];
  hasItems: boolean;
  connection: Connection | null;
  categoryActions: ToolbarAction[];
  onRefresh: () => void;
  onSelectAll: () => void;
  onClear: () => void;
  onRunAction: (action: ToolbarAction) => void;
}

export function Toolbar({
  selection,
  hasItems,
  connection,
  categoryActions,
  onRefresh,
  onSelectAll,
  onClear,
  onRunAction,
}: ToolbarProps): JSX.Element {
  return (
    <div className="pam-toolbar" role="toolbar" aria-label="Actions">
      <button type="button" className="pam-btn" onClick={onRefresh}>
        Refresh
      </button>
      <button type="button" className="pam-btn" onClick={onSelectAll} disabled={!hasItems}>
        Select All
      </button>
      <button
        type="button"
        className="pam-btn"
        onClick={onClear}
        disabled={selection.length === 0}
      >
        Clear Selection
      </button>
      {categoryActions.map((action) => (
        <button
          key={action.id}
          type="button"
          className="pam-btn"
          disabled={!action.enabled(selection, { connection })}
          onClick={() => onRunAction(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
