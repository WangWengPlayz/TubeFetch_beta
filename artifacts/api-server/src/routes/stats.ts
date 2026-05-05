import { Router, type IRouter } from "express";
import { VERSION } from "../lib/version";
import { getCount } from "../lib/counter";

const router: IRouter = Router();

router.get("/stats", (_req, res) => {
  res.json({
    version: VERSION,
    creditTo: "MJL",
    ApiCount: getCount(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
