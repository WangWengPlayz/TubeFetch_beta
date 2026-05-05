import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";
import { increment } from "../lib/counter";

const router: IRouter = Router();

const startedAt = new Date().toISOString();

router.get("/uptime", (_req, res) => {
  const ApiCount = increment();
  res.json({
    version: VERSION,
    creditTo: "MJL",
    ApiCount,
    status: "online",
    uptime_seconds: Math.floor(process.uptime()),
    started_at: startedAt,
    timestamp: new Date().toISOString(),
  });
});

export default router;
