import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ventsRouter from "./vents";
import vibeRouter from "./vibe";
import authRouter from "./auth";
import asrRouter from "./asr";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ventsRouter);
router.use(vibeRouter);
router.use(authRouter);
router.use(asrRouter);

export default router;
