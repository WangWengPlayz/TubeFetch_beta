import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { VERSION } from "../lib/version";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({ ...data, version: VERSION, creditTo: "MJL" });
});

export default router;
