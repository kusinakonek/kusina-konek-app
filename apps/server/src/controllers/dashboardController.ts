import { NextFunction, Request, Response } from "express";
import { dashboardService } from "../services/dashboardService";

export const dashboardController = {
    /**
     * GET /api/dashboard/donor
     * Returns donor dashboard data: stats and recent donations
     */
    async getDonorDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await dashboardService.getDonorDashboard(req.user!.id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/dashboard/recipient
     * Returns recipient dashboard data: stats and recent foods
     */
    async getRecipientDashboard(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await dashboardService.getRecipientDashboard(req.user!.id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/dashboard/browse
     * Returns available foods for recipients to browse
     */
    async getAvailableFoods(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await dashboardService.getAvailableFoods();
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
};
