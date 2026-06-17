import { Router, type IRouter, type Request, type Response } from "express";
import {
  isShutdown, setShutdown,
  adminBus, getRecentLogs, getMinuteBuckets,
  getServerStatus, emitAdminLog,
} from "../lib/admin-state";
import {
  verifyPassword, verifyBirthday,
  createSession, isValidSession,
  createPartialToken, consumePartialToken,
} from "../lib/admin-auth";
import { getAllCounts } from "../lib/counter";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

// ── Auth helper ───────────────────────────────────────────────────────────────
function getBearerToken(req: Request): string | undefined {
  const h = req.headers["authorization"] ?? "";
  if (typeof h === "string" && h.startsWith("Bearer ")) return h.slice(7).trim();
  // Also allow ?tok= query param (for EventSource which can't set headers)
  const q = req.query["tok"];
  return typeof q === "string" ? q : undefined;
}

function requireAuth(req: Request, res: Response): boolean {
  const token = getBearerToken(req);
  if (!isValidSession(token)) {
    res.status(401).json({ ok: false, error: "Unauthorized." });
    return false;
  }
  return true;
}

function isOppoDevice(ua: string): boolean {
  return /OPPO[_ ]?A3x/i.test(ua);
}

// ── POST /admin/api/auth ──────────────────────────────────────────────────────
// Two modes:
//   { password }                          → verify password; if OPPO UA, issue token immediately;
//                                           otherwise issue partialToken and require birthday
//   { partialToken, birthday }            → verify birthday, issue full token
router.post("/admin/api/auth", (req: Request, res: Response) => {
  const { password, birthday, partialToken } = req.body as {
    password?: string;
    birthday?: string;
    partialToken?: string;
  };

  // ── Birthday path ──
  if (partialToken && birthday) {
    if (!consumePartialToken(partialToken)) {
      res.status(401).json({ ok: false, error: "Session expired. Please re-enter your access code." });
      return;
    }
    if (!verifyBirthday(birthday)) {
      res.status(401).json({ ok: false, error: "Incorrect answer." });
      return;
    }
    const token = createSession();
    emitAdminLog("info", "[Admin] Authenticated via device verification");
    res.json({ ok: true, token });
    return;
  }

  // ── Password path ──
  if (!password) {
    res.status(400).json({ ok: false, error: "Access code required." });
    return;
  }
  if (!verifyPassword(password)) {
    res.status(401).json({ ok: false, error: "Invalid access code." });
    return;
  }

  const ua = String(req.headers["user-agent"] ?? "");
  if (isOppoDevice(ua)) {
    // Trusted device — issue full token immediately
    const token = createSession();
    emitAdminLog("info", "[Admin] Authenticated from OPPO A3x");
    res.json({ ok: true, token, needsBirthday: false });
    return;
  }

  // Unknown device — issue partial token, require birthday
  const pt = createPartialToken();
  res.json({ ok: true, needsBirthday: true, partialToken: pt });
});

// ── GET /admin/api/stats ──────────────────────────────────────────────────────
router.get("/admin/api/stats", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const counts = await getAllCounts();
  res.json({
    ok: true,
    version: VERSION,
    apiCount: counts.total,
    successCount: counts.successCount,
    errorCount: counts.errorCount,
    uptimeSeconds: Math.floor(process.uptime()),
    shutdown: isShutdown(),
    minuteBuckets: getMinuteBuckets(),
    packages: {
      server1: getServerStatus(1),
    },
  });
});

// ── GET /admin/api/events (SSE) ───────────────────────────────────────────────
router.get("/admin/api/events", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  // Disable compression for SSE
  res.setHeader("Content-Encoding", "identity");
  res.setHeader("Content-Type",     "text/event-stream");
  res.setHeader("Cache-Control",    "no-cache, no-transform");
  res.setHeader("Connection",       "keep-alive");
  res.setHeader("X-Accel-Buffering","no");
  res.flushHeaders();

  function send(event: string, data: unknown): void {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  // Push recent log history immediately
  const history = getRecentLogs(150);
  if (history.length) send("history", history);

  // Push full stats immediately
  async function pushStats(): Promise<void> {
    const counts = await getAllCounts();
    send("stats", {
      apiCount:      counts.total,
      successCount:  counts.successCount,
      errorCount:    counts.errorCount,
      uptimeSeconds: Math.floor(process.uptime()),
      shutdown:      isShutdown(),
      minuteBuckets: getMinuteBuckets(),
      packages: {
        server1: getServerStatus(1),
      },
    });
  }

  void pushStats();
  const statsInterval = setInterval(() => void pushStats(), 3_000);

  // Forward log events
  function onLog(entry: unknown): void {
    send("log", entry);
  }
  adminBus.on("log", onLog);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(statsInterval);
    clearInterval(heartbeat);
    adminBus.off("log", onLog);
  });
});

// ── POST /admin/api/shutdown ──────────────────────────────────────────────────
router.post("/admin/api/shutdown", (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  setShutdown(true);
  emitAdminLog("warn", "[Admin] ⚠ Temporary Shutdown activated — all API endpoints suspended");
  res.json({ ok: true });
});

// ── POST /admin/api/run ───────────────────────────────────────────────────────
router.post("/admin/api/run", (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  setShutdown(false);
  emitAdminLog("success", "[Admin] ✓ Service restored — all API endpoints back online");
  res.json({ ok: true });
});

// ── POST /admin/api/restart ───────────────────────────────────────────────────
router.post("/admin/api/restart", (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  emitAdminLog("warn", "[Admin] 🔄 Server restart initiated");
  res.json({ ok: true });
  setTimeout(() => process.exit(0), 500);
});

export default router;
