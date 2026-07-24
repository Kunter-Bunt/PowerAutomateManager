interface SpinnerProps {
  label?: string;
  small?: boolean;
}

export function Spinner({ label, small }: SpinnerProps): JSX.Element {
  return (
    <span
      className={small ? 'pam-spinner pam-spinner-small' : 'pam-spinner'}
      role="status"
      aria-label={label ?? 'Loading'}
    />
  );
}
