import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest";
import { signInSchema, signUpSchema } from "@kusinakonek/common";
import { authController } from "../controllers/authController";

export const authRouter = Router();

authRouter.post("/signup", validateRequest(signUpSchema), authController.signUp);
authRouter.post("/login", validateRequest(signInSchema), authController.signIn);
