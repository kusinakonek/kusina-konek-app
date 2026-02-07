import { Router } from "express";
import {
  createDistributionSchema,
  markDistributionCompleteSchema,
  updateDistributionSchema,
  updateDistributionStatusSchema,
  requestDistributionSchema,
} from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireUserRole } from "../middlewares/requireUserRole";
import { validateRequest } from "../middlewares/validateRequest";
import { distributionController } from "../controllers/distributionController";

export const distributionRouter = Router();

// Get available distributions (public - no auth required)
distributionRouter.get("/available", distributionController.listAvailable);

// Create distribution (donor only)
distributionRouter.post(
  "/",
  authMiddleware,
  requireUserRole(["DONOR"]),
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

// Get distribution by ID
distributionRouter.get(
  "/:disID",
  authMiddleware,
  distributionController.getById,
);

// Update distribution (donor only)
distributionRouter.patch(
  "/:disID",
  authMiddleware,
  validateRequest(updateDistributionSchema),
  distributionController.update,
);

// Update distribution status (donor or recipient - instead of delete)
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

// Request distribution (recipient only)
distributionRouter.post(
  "/:disID/request",
  authMiddleware,
  requireUserRole(["RECIPIENT"]),
  validateRequest(requestDistributionSchema),
  distributionController.request,
);
