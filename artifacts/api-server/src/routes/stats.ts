import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";
import { getAllCounts, getMongoStatus } from "../lib/counter";

const router: IRouter = Router();

router.get("/stats", async (_req, res) => {
  const mongoStatus = getMongoStatus();
  const { total, successCount, errorCount } = await getAllCounts();
  res.json({
    version: VERSION,
    creditTo: "MJL",
    ApiCount: total,
    successCount,
    errorCount,
    // Expose a simple boolean rather than the internal state-machine string
    // ("idle", "connecting", "failed", "no-uri") which leaks infrastructure details.
    mongoConnected: mongoStatus === "connected",
    timestamp: new Date().toISOString(),
  });
});

export default router;
