type Rec = Record<string, unknown>;

export function str(record: Rec, key: string): string {
  const value = record[key];
  return value == null ? '' : String(value);
}

export function num(record: Rec, key: string): number | undefined {
  const value = record[key];
  if (value == null) return undefined;
  return typeof value === 'number' ? value : Number(value);
}

export function bool(record: Rec, key: string): boolean {
  const value = record[key];
  return value === true || value === 'true' || value === 1;
}

export function formattedValue(record: Rec, key: string): string {
  const formatted = record[`${key}@OData.Community.Display.V1.FormattedValue`];
  if (formatted != null) return String(formatted);
  const value = record[key];
  return value == null ? '' : String(value);
}
