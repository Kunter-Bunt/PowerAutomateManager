import { Spinner } from './Spinner';

export type BusyStatus = 'active' | 'waiting';

function ClockIcon(): JSX.Element {
  return (
    <svg
      className="pam-clock"
      width={14}
      height={14}
      viewBox="0 0 20 20"
      fill="currentColor"
      role="img"
      aria-label="Waiting"
      focusable={false}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 1.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11ZM9.75 6a.75.75 0 0 1 .75.75V10h2.25a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75V6.75A.75.75 0 0 1 9.75 6Z" />
    </svg>
  );
}

/** Per-row operation indicator: spinner for the flow being processed, clock for queued flows. */
export function RowStatus({ status }: { status: BusyStatus }): JSX.Element {
  return status === 'active' ? <Spinner small label="Working" /> : <ClockIcon />;
}
