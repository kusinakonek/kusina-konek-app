import { Router } from "express";
import { completeUserProfileSchema } from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";
import { userController } from "../controllers/userController";

export const usersRouter = Router();

// GET - Retrieve user profile (decrypted)
usersRouter.get("/profile", authMiddleware, userController.getProfile);

// PUT - Create or update user profile
usersRouter.put(
  "/profile",
  authMiddleware,
  validateRequest(completeUserProfileSchema),
  userController.completeProfile,
);

// PUT - Register/update Expo push token
usersRouter.put("/push-token", authMiddleware, userController.updatePushToken);
