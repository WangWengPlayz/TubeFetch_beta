import { MongoClient, Collection } from "mongodb";

type MongoState = "idle" | "connecting" | "connected" | "no-uri" | "failed";

interface CounterDoc {
  _id: string;
  value: number;
  successCount: number;
  errorCount: number;
}

let _state: MongoState = "idle";
let _col: Collection<CounterDoc> | null = null;
let _connectPromise: Promise<void> | null = null;
let _lastFailedAt = 0;
const RETRY_AFTER_MS = 60_000;

let _localTotal = 0;
let _localSuccess = 0;
let _localError = 0;

interface CachedStats {
  total: number;
  successCount: number;
  errorCount: number;
  ts: number;
}
let _statsCache: CachedStats | null = null;
const STATS_CACHE_TTL = 4_000;

async function doConnect(): Promise<void> {
  const uri = (process.env["MONGODB_URI"] ?? "").trim();

  if (!uri) {
    _state = "no-uri";
    console.warn("[TubeFetch] ⚠  MONGODB_URI env var is not set — counts are in-memory only (reset on restart)");
    return;
  }

  const uriPreview = uri.replace(/:\/\/[^@]+@/, "://<credentials>@");
  console.log(`[TubeFetch] 🔄 Connecting to MongoDB... (${uriPreview})`);
  _state = "connecting";

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
      socketTimeoutMS: 10_000,
      minPoolSize: 1,
      maxPoolSize: 5,
      maxIdleTimeMS: 30_000,
    });

    await client.connect();

    const col = client.db("tubefetch").collection<CounterDoc>("counters");

    await col.updateOne(
      { _id: "apiCount" },
      { $setOnInsert: { value: 0, successCount: 0, errorCount: 0 } },
      { upsert: true },
    );

    await col.updateOne(
      { _id: "apiCount", successCount: { $exists: false } },
      { $set: { successCount: 0, errorCount: 0 } },
    );

    _col = col;
    _state = "connected";
    _lastFailedAt = 0;
    console.log("[TubeFetch] ✅ MongoDB connected — total, success & error counts are now persistent");
  } catch (err) {
    _state = "failed";
    _col = null;
    _lastFailedAt = Date.now();
    const e = err as Error & { code?: string | number; codeName?: string };
    console.error("[TubeFetch] ❌ MongoDB connection failed");
    console.error(`[TubeFetch]    name    : ${e.name}`);
    console.error(`[TubeFetch]    message : ${e.message}`);
    if (e.code)     console.error(`[TubeFetch]    code    : ${e.code}`);
    if (e.codeName) console.error(`[TubeFetch]    codeName: ${e.codeName}`);
    console.warn("[TubeFetch] ⚠  Falling back to in-memory counts (not persistent across restarts)");
    console.warn(`[TubeFetch] ⚠  Will retry in ${RETRY_AFTER_MS / 1000}s`);
  }
}

function ensureConnected(): Promise<void> {
  if (_state === "failed" && Date.now() - _lastFailedAt > RETRY_AFTER_MS) {
    console.log("[TubeFetch] 🔄 Retrying MongoDB connection...");
    _state = "idle";
    _connectPromise = null;
  }
  if (_state === "idle") {
    _connectPromise = doConnect();
  }
  return _connectPromise ?? Promise.resolve();
}

ensureConnected();

export async function resetCount(): Promise<void> {
  await ensureConnected();
  _localTotal = 0;
  _localSuccess = 0;
  _localError = 0;
  _statsCache = null;
  if (!_col) return;
  await _col.updateOne(
    { _id: "apiCount" },
    { $set: { value: 0, successCount: 0, errorCount: 0 } },
    { upsert: true },
  );
  console.log("[TubeFetch] 🔄 ApiCount reset to 0");
}

export async function increment(): Promise<number> {
  _localTotal++;
  _statsCache = null;
  await ensureConnected();
  if (!_col) return _localTotal;
  try {
    const doc = await _col.findOneAndUpdate(
      { _id: "apiCount" },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" },
    );
    return doc?.value ?? _localTotal;
  } catch {
    return _localTotal;
  }
}

export function recordSuccess(): void {
  _localSuccess++;
  _statsCache = null;
  if (!_col) return;
  _col
    .updateOne({ _id: "apiCount" }, { $inc: { successCount: 1 } }, { upsert: true })
    .catch(() => {});
}

export function recordError(): void {
  _localError++;
  _statsCache = null;
  if (!_col) return;
  _col
    .updateOne({ _id: "apiCount" }, { $inc: { errorCount: 1 } }, { upsert: true })
    .catch(() => {});
}

export async function getAllCounts(): Promise<{
  total: number;
  successCount: number;
  errorCount: number;
}> {
  if (_statsCache && Date.now() - _statsCache.ts < STATS_CACHE_TTL) {
    return { total: _statsCache.total, successCount: _statsCache.successCount, errorCount: _statsCache.errorCount };
  }
  await ensureConnected();
  if (!_col) {
    return { total: _localTotal, successCount: _localSuccess, errorCount: _localError };
  }
  try {
    const doc = await _col.findOne({ _id: "apiCount" });
    const result = {
      total:        doc?.value        ?? _localTotal,
      successCount: doc?.successCount ?? _localSuccess,
      errorCount:   doc?.errorCount   ?? _localError,
    };
    _statsCache = { ...result, ts: Date.now() };
    return result;
  } catch {
    return { total: _localTotal, successCount: _localSuccess, errorCount: _localError };
  }
}

export async function getCount(): Promise<number> {
  const { total } = await getAllCounts();
  return total;
}

export function getSuccess(): number { return _localSuccess; }
export function getError(): number   { return _localError; }
export function getMongoStatus(): MongoState { return _state; }
