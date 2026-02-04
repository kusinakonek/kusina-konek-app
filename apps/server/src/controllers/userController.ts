import { NextFunction, Request, Response } from "express";
import { CompleteUserProfileInput } from "@kusinakonek/common";
import { userService } from "../services/userService";

export const userController = {
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
  }
};
