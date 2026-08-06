/** Short TTL cache around raw sheet reads — Sheets API quota is 100 req/100s/user and latency is much higher than Postgres; without this, the login path alone would hit the API on every request. */

const TTL_MS = process.env.VITEST ? 0 : 15_000;

const store = new Map<string, { value: unknown; expiresAt: number }>();

export function getCached<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function setCached<T>(key: string, value: T): void {
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCache(key: string): void {
  store.delete(key);
}

export function invalidateAllCache(): void {
  store.clear();
}
