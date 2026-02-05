import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const dashboardRouter = Router();

// All dashboard routes require authentication
dashboardRouter.use(authMiddleware);

// Donor dashboard - get stats and recent donations
dashboardRouter.get("/donor", dashboardController.getDonorDashboard);

// Recipient dashboard - get stats and recent foods
dashboardRouter.get("/recipient", dashboardController.getRecipientDashboard);

// Browse available foods (for recipients)
dashboardRouter.get("/browse", dashboardController.getAvailableFoods);
