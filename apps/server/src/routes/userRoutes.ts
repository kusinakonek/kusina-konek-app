import { Router } from "express";
import { completeUserProfileSchema } from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";
import { userController } from "../controllers/userController";

export const usersRouter = Router();

usersRouter.put(
  "/profile",
  authMiddleware,
  validateRequest(completeUserProfileSchema),
  userController.completeProfile
);
