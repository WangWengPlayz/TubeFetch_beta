import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

const startedAt = new Date().toISOString();

router.get("/uptime", (_req, res) => {
  res.json({
    version: VERSION,
    creditTo: "MJL",
    status: "online",
    uptime_seconds: Math.floor(process.uptime()),
    started_at: startedAt,
    timestamp: new Date().toISOString(),
  });
});

export default router;
