import { NextFunction, Request, Response } from "express";
import { CompleteUserProfileInput } from "@kusinakonek/common";
import { userService } from "../services/userService";

export const userController = {
  /**
   * GET /api/users/profile
   * Get the authenticated user's profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await userService.getProfile({
        authUserId: req.user.id,
        authEmail: req.user.email
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/users/profile
   * Create or update the authenticated user's DB profile
   */
  async completeProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const input = req.body as CompleteUserProfileInput;

      const result = await userService.completeProfile({
        authUserId: req.user.id,
        authEmail: req.user.email,
        authRole: req.user.role,
        input
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
  /**
   * PUT /api/users/push-token
   * Register or update the user's Expo push token for background notifications
   */
  async updatePushToken(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { pushToken, latitude, longitude } = req.body;
      if (pushToken !== null && typeof pushToken !== "string") {
        return res.status(400).json({ error: "pushToken must be a string or null" });
      }

      await userService.updatePushToken({
        userID: req.user.id,
        pushToken,
        latitude,
        longitude
      });
      return res.status(200).json({ message: "Push token and location updated" });
    } catch (error) {
      console.error("[updatePushToken] Error:", error);
      next(error);
    }
  },

  /**
   * DELETE /api/users/account
   * Delete the authenticated user's account and all associated data
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await userService.deleteAccount(req.user.id);
      return res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("[deleteAccount] Error:", error);
      next(error);
    }
  },
};
