import { Router } from "express";
import {
  createDistributionSchema,
  markDistributionCompleteSchema,
  updateDistributionSchema,
  updateDistributionStatusSchema,
  requestDistributionSchema,
} from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";
import { distributionController } from "../controllers/distributionController";

export const distributionRouter = Router();

// Get available distributions (authenticated - excludes user's own donations)
distributionRouter.get(
  "/available",
  authMiddleware,
  distributionController.listAvailable,
);

// Create distribution
distributionRouter.post(
  "/",
  authMiddleware,
  validateRequest(createDistributionSchema),
  distributionController.create,
);

// Get all distributions (authenticated users)
distributionRouter.get("/", authMiddleware, distributionController.getAll);

// Get my distributions (donor or recipient)
distributionRouter.get(
  "/mine",
  authMiddleware,
  distributionController.listMine,
);

// Get claim limits for current user
distributionRouter.get(
  "/claim-limits",
  authMiddleware,
  distributionController.claimLimits,
);

// Get distribution by ID
distributionRouter.get(
  "/:disID",
  authMiddleware,
  distributionController.getById,
);

// Update distribution
distributionRouter.patch(
  "/:disID",
  authMiddleware,
  validateRequest(updateDistributionSchema),
  distributionController.update,
);

// Update distribution status
distributionRouter.patch(
  "/:disID/status",
  authMiddleware,
  validateRequest(updateDistributionStatusSchema),
  distributionController.updateStatus,
);

// Mark distribution as complete
distributionRouter.post(
  "/:disID/complete",
  authMiddleware,
  validateRequest(markDistributionCompleteSchema),
  distributionController.complete,
);

// Request distribution
distributionRouter.post(
  "/:disID/request",
  authMiddleware,
  validateRequest(requestDistributionSchema),
  distributionController.request,
);

// Recipient marks they are on the way to pick up food
distributionRouter.post(
  "/:disID/on-the-way",
  authMiddleware,
  distributionController.markOnTheWay,
);
