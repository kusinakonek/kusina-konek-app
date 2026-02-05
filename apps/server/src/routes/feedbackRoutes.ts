import { Router } from "express";
import { createFeedbackSchema, updateFeedbackSchema } from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";
import { feedbackController } from "../controllers/feedbackController";

export const feedbackRouter = Router();

feedbackRouter.post(
  "/",
  authMiddleware,
  validateRequest(createFeedbackSchema),
  feedbackController.create
);

feedbackRouter.get(
  "/distribution/:disID",
  authMiddleware,
  feedbackController.listForDistribution
);

feedbackRouter.put(
  "/:feedbackID",
  authMiddleware,
  validateRequest(updateFeedbackSchema),
  feedbackController.update
);

feedbackRouter.get(
  "/received",
  authMiddleware,
  feedbackController.listReceived
);
