export interface PickerOption {
  value: string;
  label: string;
  group?: string;
}

export interface PickerConfig {
  title: string;
  options: PickerOption[];
  multiple?: boolean;
  confirmLabel?: string;
}

type Resolver = (values: string[] | null) => void;
type Opener = (config: PickerConfig, resolve: Resolver) => void;

let opener: Opener | null = null;

export function registerPickerHost(fn: Opener | null): void {
  opener = fn;
}

/**
 * Opens the shared modal picker and resolves with the chosen values, or null if
 * the user cancels (or no picker host is mounted). Actions use this to collect a
 * target owner / solution / connection / principal before running.
 */
export function openPicker(config: PickerConfig): Promise<string[] | null> {
  return new Promise((resolve) => {
    if (!opener) {
      resolve(null);
      return;
    }
    opener(config, resolve);
  });
}
