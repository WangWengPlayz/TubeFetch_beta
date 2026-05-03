import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uptimeRouter from "./uptime";
import downloadRouter from "./download";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uptimeRouter);
router.use(downloadRouter);

export default router;
