import {
  getToolboxApi,
  type Connection,
  type HostEvent,
  type NotifyOptions,
} from '../models/hostApi';

export async function getActiveConnection(): Promise<Connection | null> {
  return getToolboxApi().connections.getActiveConnection();
}

export function onHostEvent(handler: (evt: HostEvent) => void): () => void {
  return getToolboxApi().events.on(handler);
}

export async function notify(options: NotifyOptions): Promise<void> {
  return getToolboxApi().utils.showNotification(options);
}

export async function copy(text: string): Promise<void> {
  return getToolboxApi().utils.copyToClipboard(text);
}

export async function getTheme(): Promise<'light' | 'dark'> {
  return getToolboxApi().utils.getCurrentTheme();
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return getToolboxApi().settings.get<T>(key);
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  return getToolboxApi().settings.set<T>(key, value);
}
