import "server-only";

const store = new Map<string, { expires: number; value: unknown }>();

export function cacheGet<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expires <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs: number) {
  store.set(key, { expires: Date.now() + ttlMs, value });
}

export async function cacheLoad<T>(key: string, load: () => Promise<T>, ttlMs: number): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await load();
  cacheSet(key, value, ttlMs);
  return value;
}

export function cacheClear(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of [...store.keys()]) {
    if (key === prefix || key.startsWith(`${prefix}:`) || key.startsWith(prefix)) store.delete(key);
  }
}
