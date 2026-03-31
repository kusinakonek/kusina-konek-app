import { Router } from "express";
import { authRouter } from "./authRoutes";
import { dashboardRouter } from "./dashboardRoutes";
import { distributionRouter } from "./distributionRoutes";
import { feedbackRouter } from "./feedbackRoutes";
import { foodRouter } from "./foodRoutes";
import { locationRouter } from "./locationRoutes";
import { messageRouter } from "./messageRoutes";
import { usersRouter } from "./userRoutes";
import { notificationRouter } from "./notificationRoutes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/foods", foodRouter);
apiRouter.use("/locations", locationRouter);
apiRouter.use("/distributions", distributionRouter);
apiRouter.use("/feedback", feedbackRouter);
apiRouter.use("/messages", messageRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/notifications", notificationRouter);
