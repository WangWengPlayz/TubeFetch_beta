import { MongoClient } from "mongodb";

let _success = 0;
let _error = 0;

let client: MongoClient | null = null;
let dbReady = false;

async function getCollection() {
  if (!dbReady) {
    const uri = process.env["MONGODB_URI"];
    if (!uri) return null;
    try {
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
      await client.connect();
      dbReady = true;
    } catch {
      client = null;
      return null;
    }
  }
  if (!client) return null;
  return client.db("tubefetch").collection<{ _id: string; value: number }>("counters");
}

async function mongoIncrement(): Promise<number> {
  try {
    const col = await getCollection();
    if (!col) return 0;
    const doc = await col.findOneAndUpdate(
      { _id: "apiCount" },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" },
    );
    return doc?.value ?? 1;
  } catch {
    return 0;
  }
}

async function mongoGetCount(): Promise<number> {
  try {
    const col = await getCollection();
    if (!col) return 0;
    const doc = await col.findOne({ _id: "apiCount" });
    return doc?.value ?? 0;
  } catch {
    return 0;
  }
}

let _localCount = 0;

export async function increment(): Promise<number> {
  _localCount++;
  const remote = await mongoIncrement();
  return remote > 0 ? remote : _localCount;
}

export function recordSuccess(): void {
  _success++;
}

export function recordError(): void {
  _error++;
}

export async function getCount(): Promise<number> {
  const remote = await mongoGetCount();
  return remote > 0 ? remote : _localCount;
}

export function getSuccess(): number {
  return _success;
}

export function getError(): number {
  return _error;
}
