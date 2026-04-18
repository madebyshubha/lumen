import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ventsRouter from "./vents";
import vibeRouter from "./vibe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ventsRouter);
router.use(vibeRouter);

export default router;
