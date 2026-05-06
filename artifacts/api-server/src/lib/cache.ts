interface CacheEntry<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly freshTtlMs: number;
  private readonly staleTtlMs: number;

  constructor(freshTtlMs: number, staleTtlMs?: number) {
    this.freshTtlMs = freshTtlMs;
    this.staleTtlMs = staleTtlMs ?? freshTtlMs * 4;
  }

  get(key: string): T | undefined {
    const result = this.getWithMeta(key);
    return result?.value;
  }

  getWithMeta(key: string): { value: T; stale: boolean } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    const now = Date.now();
    if (now > entry.staleUntil) {
      this.store.delete(key);
      return undefined;
    }
    return { value: entry.value, stale: now > entry.freshUntil };
  }

  set(key: string, value: T): void {
    const now = Date.now();
    this.store.set(key, {
      value,
      freshUntil: now + this.freshTtlMs,
      staleUntil: now + this.staleTtlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  size(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.staleUntil) {
        this.store.delete(key);
      } else {
        count++;
      }
    }
    return count;
  }
}
