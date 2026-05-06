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

let _localTotal = 0;
let _localSuccess = 0;
let _localError = 0;

async function doConnect(): Promise<void> {
  const uri = (process.env["MONGODB_URI"] ?? "").trim();

  if (!uri) {
    _state = "no-uri";
    console.log("[TubeFetch] ⚠  MONGODB_URI not set — counts are in-memory only (reset on restart)");
    return;
  }

  _state = "connecting";
  console.log("[TubeFetch] 🔄 Connecting to MongoDB...");

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
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
    console.log("[TubeFetch] ✅ MongoDB connected — total, success & error counts are now persistent");
  } catch (err) {
    _state = "failed";
    _col = null;
    console.error("[TubeFetch] ❌ MongoDB connection failed:", (err as Error).message);
    console.log("[TubeFetch] ⚠  Falling back to in-memory counts (not persistent)");
  }
}

function ensureConnected(): Promise<void> {
  if (_state === "idle") {
    _connectPromise = doConnect();
  }
  return _connectPromise ?? Promise.resolve();
}

ensureConnected();

export async function increment(): Promise<number> {
  _localTotal++;
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
  if (!_col) return;
  _col
    .updateOne({ _id: "apiCount" }, { $inc: { successCount: 1 } }, { upsert: true })
    .catch(() => {});
}

export function recordError(): void {
  _localError++;
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
  await ensureConnected();
  if (!_col) {
    return { total: _localTotal, successCount: _localSuccess, errorCount: _localError };
  }
  try {
    const doc = await _col.findOne({ _id: "apiCount" });
    return {
      total:        doc?.value        ?? _localTotal,
      successCount: doc?.successCount ?? _localSuccess,
      errorCount:   doc?.errorCount   ?? _localError,
    };
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
