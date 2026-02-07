import { Router } from "express";
import { createFeedbackSchema, updateFeedbackSchema } from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";
import { feedbackController } from "../controllers/feedbackController";
import { requireUserRole } from "../middlewares/requireUserRole";

export const feedbackRouter = Router();

// Create feedback - only RECIPIENT can give feedback
feedbackRouter.post(
  "/",
  authMiddleware,
  requireUserRole(["RECIPIENT"]),
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

// View received feedback - only DONOR can see feedback they received
feedbackRouter.get(
  "/received",
  authMiddleware,
  requireUserRole(["DONOR"]),
  feedbackController.listReceived
);

