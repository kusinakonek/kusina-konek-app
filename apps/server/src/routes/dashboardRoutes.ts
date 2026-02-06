import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireUserRole } from "../middlewares/requireUserRole";

export const dashboardRouter = Router();

// All dashboard routes require authentication
dashboardRouter.use(authMiddleware);

// Donor dashboard - only for DONOR role
dashboardRouter.get("/donor", requireUserRole(["DONOR"]), dashboardController.getDonorDashboard);

// Recipient dashboard - only for RECIPIENT role
dashboardRouter.get("/recipient", requireUserRole(["RECIPIENT"]), dashboardController.getRecipientDashboard);

// Browse available foods (accessible to both donors and recipients)
dashboardRouter.get("/browse", dashboardController.getAvailableFoods);

