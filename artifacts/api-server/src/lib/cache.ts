interface CacheEntry<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
}

/**
 * TTL cache with stale-while-revalidate support and LRU size cap.
 *
 * Security: without a maxSize guard an attacker can exhaust heap memory by
 * generating an unbounded number of unique cache keys. When capacity is reached
 * we first evict genuinely expired entries; if none exist we evict the
 * least-recently-used entry (first in Map insertion order).
 */
export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly freshTtlMs: number;
  private readonly staleTtlMs: number;
  private readonly maxSize: number;

  constructor(freshTtlMs: number, staleTtlMs?: number, maxSize = 500) {
    this.freshTtlMs = freshTtlMs;
    this.staleTtlMs = staleTtlMs ?? freshTtlMs * 4;
    this.maxSize = maxSize;
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
    // Refresh LRU order on access
    this.store.delete(key);
    this.store.set(key, entry);
    return { value: entry.value, stale: now > entry.freshUntil };
  }

  set(key: string, value: T): void {
    const now = Date.now();
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      this.evictOne(now);
    }
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

  private evictOne(now: number): void {
    // Prefer evicting already-expired entries first
    for (const [key, entry] of this.store) {
      if (now > entry.staleUntil) {
        this.store.delete(key);
        return;
      }
    }
    // All entries still valid — evict least recently used (first in Map order)
    const firstKey = this.store.keys().next().value;
    if (firstKey !== undefined) this.store.delete(firstKey);
  }
}
