/**
 * LRU-evicting bounded Map.
 *
 * Security purpose: prevents heap exhaustion from attacker-driven unique key
 * flooding. Without a size cap, an adversary can fill process memory by sending
 * an unbounded stream of distinct queries (e.g. "song 1", "song 2", … "song N").
 *
 * Implementation: standard Map preserves insertion order, so the first entry is
 * always the least-recently-used one. On each get() we delete-and-re-insert to
 * move the entry to the tail (most-recently-used).
 */
export class BoundedMap<K, V> {
  private readonly max: number;
  private readonly store = new Map<K, V>();

  constructor(max: number) {
    if (max < 1) throw new RangeError("BoundedMap max must be >= 1");
    this.max = max;
  }

  get(key: K): V | undefined {
    const val = this.store.get(key);
    if (val !== undefined) {
      // Refresh to "most recently used" position
      this.store.delete(key);
      this.store.set(key, val);
    }
    return val;
  }

  set(key: K, value: V): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.max) {
      // Evict least recently used (first key in insertion order)
      const lruKey = this.store.keys().next().value;
      if (lruKey !== undefined) this.store.delete(lruKey);
    }
    this.store.set(key, value);
  }

  has(key: K): boolean {
    return this.store.has(key);
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}
