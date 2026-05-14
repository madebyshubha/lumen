import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ventsRouter from "./vents";
import vibeRouter from "./vibe";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ventsRouter);
router.use(vibeRouter);
router.use(authRouter);

export default router;
