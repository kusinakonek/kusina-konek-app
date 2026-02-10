import { Router } from "express";
import { dashboardController } from "../controllers/dashboardController";
import { authMiddleware } from "../middlewares/authMiddleware";

export const dashboardRouter = Router();

// All dashboard routes require authentication
dashboardRouter.use(authMiddleware);

// Donor dashboard - accessible to any authenticated user
// (same account can switch between DONOR and RECIPIENT roles)
dashboardRouter.get("/donor", dashboardController.getDonorDashboard);

// Recipient dashboard - accessible to any authenticated user
dashboardRouter.get("/recipient", dashboardController.getRecipientDashboard);

// Browse available foods (accessible to both donors and recipients)
dashboardRouter.get("/browse", dashboardController.getAvailableFoods);

