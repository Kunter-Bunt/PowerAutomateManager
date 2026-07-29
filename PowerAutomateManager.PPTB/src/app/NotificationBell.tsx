import { useSyncExternalStore, useState, useRef, useEffect } from 'react';
import {
  subscribe,
  getRecords,
  getUnreadCount,
  markAllRead,
  clearAll,
  type NotificationRecord,
} from '../state/notificationCenter';

function BellIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" role="img" aria-label="Notifications">
      <path
        d="M12 3a5 5 0 0 0-5 5v3.5c0 .6-.24 1.17-.66 1.6L5 17h14l-1.34-3.9a2.26 2.26 0 0 1-.66-1.6V8a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function NotificationItem({ record }: { record: NotificationRecord }): JSX.Element {
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = Boolean(record.details && record.details.length > 0);
  return (
    <li className={`pam-note pam-note-${record.type}`}>
      <div className="pam-note-head">
        <span className="pam-note-title">{record.title}</span>
        <span className="pam-note-time">{formatTime(record.timestamp)}</span>
      </div>
      <div className="pam-note-body">{record.body}</div>
      {hasDetails && (
        <div className="pam-note-details">
          <button
            type="button"
            className="pam-link-btn"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? 'Hide details' : `Show details (${record.details!.length})`}
          </button>
          {showDetails && (
            <ul className="pam-note-detail-list">
              {record.details!.map((detail, index) => (
                <li key={`${detail.id}-${index}`}>
                  <span className="pam-note-detail-id">{detail.id}</span>
                  <span className="pam-note-detail-reason">{detail.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export function NotificationBell(): JSX.Element {
  const records = useSyncExternalStore(subscribe, getRecords);
  const unread = useSyncExternalStore(subscribe, getUnreadCount);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const toggle = (): void => {
    setOpen((prev) => {
      const next = !prev;
      if (next) markAllRead();
      return next;
    });
  };

  return (
    <div className="pam-bell" ref={wrapRef}>
      <button
        type="button"
        className="pam-bell-btn"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={toggle}
      >
        <BellIcon />
        {unread > 0 && <span className="pam-bell-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="pam-bell-panel" role="dialog" aria-label="Notification history">
          <div className="pam-bell-head">
            <span>Notifications</span>
            <button
              type="button"
              className="pam-link-btn"
              onClick={clearAll}
              disabled={records.length === 0}
            >
              Clear
            </button>
          </div>
          {records.length === 0 ? (
            <div className="pam-bell-empty">No notifications yet.</div>
          ) : (
            <ul className="pam-bell-list">
              {records.map((record) => (
                <NotificationItem key={record.id} record={record} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
