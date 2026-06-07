export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function prop(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

export function dataOf<T>(value: unknown): T {
  return (isRecord(value) && 'data' in value ? value.data : value) as T;
}

export function arrayOf(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  const data = prop(value, 'data');
  if (Array.isArray(data)) return data;

  const content = prop(value, 'content');
  if (Array.isArray(content)) return content;

  const dataContent = prop(data, 'content');
  if (Array.isArray(dataContent)) return dataContent;

  return [];
}

export function stringProp(value: unknown, keys: string[], fallback = '') {
  for (const key of keys) {
    const candidate = prop(value, key);
    if (typeof candidate === 'string') return candidate;
  }

  return fallback;
}

export function numberProp(value: unknown, keys: string[]) {
  for (const key of keys) {
    const candidate = prop(value, key);
    if (typeof candidate === 'number') return candidate;
    if (typeof candidate === 'string' && candidate.trim()) return Number(candidate);
  }

  return NaN;
}
