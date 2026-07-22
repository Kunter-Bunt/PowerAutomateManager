import { useEffect, useState } from 'react';
import type { CategoryModule, DetailField, ListItem } from '../models/types';

interface DetailsPanelProps {
  item: ListItem | null;
  selectionCount: number;
  module: CategoryModule | undefined;
}

function FieldValue({ field }: { field: DetailField }): JSX.Element {
  const isEmpty = Array.isArray(field.value) ? field.value.length === 0 : field.value === '';
  if (isEmpty) {
    return <span className="pam-field-empty">{field.emptyText ?? '—'}</span>;
  }
  if (Array.isArray(field.value)) {
    return (
      <ul>
        {field.value.map((entry, index) => (
          <li key={`${entry}-${index}`}>{entry}</li>
        ))}
      </ul>
    );
  }
  return <span>{field.value}</span>;
}

export function DetailsPanel({ item, selectionCount, module }: DetailsPanelProps): JSX.Element {
  const [fields, setFields] = useState<DetailField[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item || !module) {
      setFields(null);
      return;
    }
    let active = true;
    setLoading(true);
    module
      .getDetails(item)
      .then((result) => {
        if (active) setFields(result);
      })
      .catch(() => {
        if (active) setFields([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [item, module]);

  if (selectionCount === 0) {
    return <div className="pam-details pam-state">Select an object to see its details.</div>;
  }
  if (selectionCount > 1) {
    return (
      <div className="pam-details pam-state">
        {selectionCount} objects selected. Select a single object to see its details.
      </div>
    );
  }
  if (loading || fields === null) {
    return <div className="pam-details pam-state">Loading details…</div>;
  }

  return (
    <div className="pam-details">
      {fields.map((field) => (
        <div className="pam-field" key={field.label}>
          <div className="pam-field-label">{field.label}</div>
          <FieldValue field={field} />
        </div>
      ))}
    </div>
  );
}
