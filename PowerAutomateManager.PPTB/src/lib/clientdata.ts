/** Extracts the connection reference logical names declared in a flow's clientdata. */
export function parseConnectionReferenceLogicalNames(clientdata: string): string[] {
  if (!clientdata) return [];
  const names = new Set<string>();
  const regex = /"connectionReferenceLogicalName"\s*:\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clientdata)) !== null) {
    names.add(match[1]);
  }
  return [...names];
}
