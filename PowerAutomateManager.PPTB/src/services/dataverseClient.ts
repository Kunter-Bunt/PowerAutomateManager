import { getDataverseApi, type ExecuteRequest } from '../models/hostApi';

const PAGE_ATTR = '@Microsoft.Dynamics.CRM.fetchxmlpagingcookie';

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}

function setPageAttributes(fetchXml: string, page: number, cookie: string | undefined): string {
  const cookieAttr = cookie ? ` paging-cookie="${escapeAttr(cookie)}"` : '';
  if (/<fetch[^>]*\bpage=/.test(fetchXml)) {
    return fetchXml.replace(/(<fetch[^>]*?)\s*page="[^"]*"([^>]*>)/, `$1$2`);
  }
  return fetchXml.replace(/<fetch\b/, `<fetch page="${page}"${cookieAttr}`);
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Runs a FetchXML query, following paging cookies until all pages are read.
 * Aborts early when the signal is triggered (e.g. category switch / refresh).
 */
export async function fetchAll(
  fetchXml: string,
  signal: AbortSignal,
): Promise<Record<string, unknown>[]> {
  const api = getDataverseApi();
  const results: Record<string, unknown>[] = [];
  let page = 1;
  let cookie: string | undefined;

  // Guard against unbounded loops if the host never returns a paging cookie.
  const maxPages = 500;
  for (let i = 0; i < maxPages; i++) {
    throwIfAborted(signal);
    const paged = setPageAttributes(fetchXml, page, cookie);
    const res = await api.fetchXmlQuery(paged);
    results.push(...res.value);
    const nextCookie = res[PAGE_ATTR] as string | undefined;
    if (!nextCookie || res.value.length === 0) break;
    cookie = nextCookie;
    page += 1;
  }
  return results;
}

export async function query(
  odata: string,
  signal: AbortSignal,
): Promise<Record<string, unknown>[]> {
  throwIfAborted(signal);
  const res = await getDataverseApi().queryData(odata);
  return res.value;
}

export async function retrieve(
  entity: string,
  id: string,
  columns: string[],
): Promise<Record<string, unknown>> {
  return getDataverseApi().retrieve(entity, id, columns);
}

export async function update(
  entity: string,
  id: string,
  record: Record<string, unknown>,
): Promise<void> {
  return getDataverseApi().update(entity, id, record);
}

export async function execute(req: ExecuteRequest): Promise<Record<string, unknown>> {
  return getDataverseApi().execute(req);
}

export async function getSolutions(columns: string[]): Promise<Record<string, unknown>[]> {
  const res = await getDataverseApi().getSolutions(columns);
  return res.value;
}
