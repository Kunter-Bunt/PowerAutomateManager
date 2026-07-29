// Minimal typed surface of the PPTB host globals this tool uses.
// We access the globals through a typed accessor rather than declaring them
// globally, so the tool compiles offline without depending on @pptb/types at
// build time (the constitution still lists @pptb/types as a dev dependency).

export interface Connection {
  id: string;
  name: string;
  url: string;
  environment: 'Dev' | 'Test' | 'UAT' | 'Production';
  enabledForPowerPlatformAPI?: boolean;
  scopesForPowerPlatformAPI?: string[];
}

export type HostEventName = 'connection:updated' | 'settings:updated' | string;

export interface HostEvent {
  event: HostEventName;
  data?: unknown;
}

export interface NotifyOptions {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface FetchXmlResult {
  value: Record<string, unknown>[];
  '@Microsoft.Dynamics.CRM.fetchxmlpagingcookie'?: string;
}

export interface ExecuteRequest {
  entityName?: string;
  entityId?: string;
  operationName: string;
  operationType: 'action' | 'function';
  parameters?: Record<string, unknown>;
}

export interface PowerPlatformResponse {
  status?: number;
  data?: unknown;
  [key: string]: unknown;
}

export interface ToolboxApi {
  connections: {
    getActiveConnection(): Promise<Connection | null>;
  };
  utils: {
    showNotification(options: NotifyOptions): Promise<void>;
    copyToClipboard(text: string): Promise<void>;
    getCurrentTheme(): Promise<'light' | 'dark'>;
  };
  settings: {
    get<T = unknown>(key: string): Promise<T | undefined>;
    set<T = unknown>(key: string, value: T): Promise<void>;
  };
  events: {
    on(handler: (payload: HostEvent) => void): () => void;
  };
}

export interface DataverseApi {
  fetchXmlQuery(fetchXml: string, connectionTarget?: 'primary' | 'secondary'): Promise<FetchXmlResult>;
  queryData(
    odataQuery: string,
    connectionTarget?: 'primary' | 'secondary',
  ): Promise<{ value: Record<string, unknown>[] }>;
  retrieve(
    entityLogicalName: string,
    id: string,
    columns?: string[],
    connectionTarget?: 'primary' | 'secondary',
  ): Promise<Record<string, unknown>>;
  update(
    entityLogicalName: string,
    id: string,
    record: Record<string, unknown>,
    connectionTarget?: 'primary' | 'secondary',
  ): Promise<void>;
  updateMultiple(
    entityLogicalName: string,
    records: Record<string, unknown>[],
    connectionTarget?: 'primary' | 'secondary',
  ): Promise<void>;
  execute(
    request: ExecuteRequest,
    connectionTarget?: 'primary' | 'secondary',
  ): Promise<Record<string, unknown>>;
  getSolutions(
    selectColumns: string[],
    connectionTarget?: 'primary' | 'secondary',
  ): Promise<{ value: Record<string, unknown>[] }>;
}

export type PpNamespace =
  | 'Analytics'
  | 'AppManagement'
  | 'Authorization'
  | 'Connectivity'
  | 'CopilotStudio'
  | 'Dynamics'
  | 'EnvironmentManagement'
  | 'Governance'
  | 'Licensing'
  | 'PowerApps'
  | 'PowerAutomate'
  | 'PowerPages'
  | 'ResourceQuery'
  | 'UserManagement'
  | 'WorkflowAgents';

export type PpClient = Record<
  PpNamespace,
  {
    Get(path?: string, connectionTarget?: 'primary' | 'secondary'): Promise<PowerPlatformResponse>;
    Post(
      path?: string,
      body?: unknown,
      connectionTarget?: 'primary' | 'secondary',
    ): Promise<PowerPlatformResponse>;
    Put(
      path?: string,
      body?: unknown,
      connectionTarget?: 'primary' | 'secondary',
    ): Promise<PowerPlatformResponse>;
  }
>;

interface HostWindow {
  toolboxAPI?: ToolboxApi;
  dataverseAPI?: DataverseApi;
  powerplatformAPI?: PpClient;
}

const hostWindow = (): HostWindow => window as unknown as HostWindow;

export function getToolboxApi(): ToolboxApi {
  const api = hostWindow().toolboxAPI;
  if (!api) throw new Error('PPTB host (toolboxAPI) is not available.');
  return api;
}

export function getDataverseApi(): DataverseApi {
  const api = hostWindow().dataverseAPI;
  if (!api) throw new Error('PPTB host (dataverseAPI) is not available.');
  return api;
}

export function getPowerPlatformApi(): PpClient {
  const api = hostWindow().powerplatformAPI;
  if (!api) throw new Error('PPTB host (powerplatformAPI) is not available.');
  return api;
}
