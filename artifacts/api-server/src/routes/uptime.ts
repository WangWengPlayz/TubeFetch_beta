import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

router.get("/uptime", (_req, res) => {
  res.json({
    version: VERSION,
    creditTo: "MJL",
    status: "online",
    // Only expose relative uptime — exact start timestamps help attackers time
    // requests around restarts (when in-memory rate-limit counters reset).
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
