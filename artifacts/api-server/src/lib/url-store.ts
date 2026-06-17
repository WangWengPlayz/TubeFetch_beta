import { randomBytes } from "crypto";

export interface ProxyEntry {
  type: "proxy";
  url: string;
  ext: string;
  title: string | null;
}

export interface MergeEntry {
  type: "merge";
  v: string;
  a: string;
  title: string | null;
  dur: number | null;
}

export type UrlEntry = ProxyEntry | MergeEntry;

const store = new Map<string, { entry: UrlEntry; expiresAt: number }>();

const TTL_MS = 6 * 60 * 60 * 1000;

function purgeExpired(): void {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.expiresAt) store.delete(key);
  }
}

export function storeUrl(entry: UrlEntry): string {
  if (store.size > 10_000) purgeExpired();
  const token = randomBytes(6).toString("base64url");
  store.set(token, { entry, expiresAt: Date.now() + TTL_MS });
  return token;
}

export function lookupUrl(token: string): UrlEntry | null {
  const record = store.get(token);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    store.delete(token);
    return null;
  }
  return record.entry;
}
