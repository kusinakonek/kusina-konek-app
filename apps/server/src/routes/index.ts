import { Router } from "express";
import { authRouter } from "./authRoutes";
import { distributionRouter } from "./distributionRoutes";
import { feedbackRouter } from "./feedbackRoutes";
import { foodRouter } from "./foodRoutes";
import { locationRouter } from "./locationRoutes";
import { usersRouter } from "./userRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/foods", foodRouter);
apiRouter.use("/locations", locationRouter);
apiRouter.use("/distributions", distributionRouter);
apiRouter.use("/feedback", feedbackRouter);
apiRouter.use("/users", usersRouter);
