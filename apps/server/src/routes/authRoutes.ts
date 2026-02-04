import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest";
import { authMiddleware } from "../middlewares/authMiddleware";
import { signInSchema, signUpSchema } from "@kusinakonek/common";
import { authController } from "../controllers/authController";
import { z } from "zod";

export const authRouter = Router();

// Validation schemas for additional endpoints
const forgotPasswordSchema = z.object({
    email: z.string().email()
});

const resetPasswordSchema = z.object({
    password: z.string().min(8)
});

const refreshTokenSchema = z.object({
    refreshToken: z.string()
});

const resendVerificationSchema = z.object({
    email: z.string().email()
});

// Public routes (no authentication required)
authRouter.post("/signup", validateRequest(signUpSchema), authController.signUp);
authRouter.post("/login", validateRequest(signInSchema), authController.signIn);
authRouter.post("/forgot-password", validateRequest(forgotPasswordSchema), authController.forgotPassword);
authRouter.post("/refresh", validateRequest(refreshTokenSchema), authController.refreshToken);
authRouter.post("/resend-verification", validateRequest(resendVerificationSchema), authController.resendVerification);

// Protected routes (authentication required)
authRouter.post("/logout", authController.signOut);
authRouter.get("/me", authMiddleware, authController.getProfile);
authRouter.post("/reset-password", authMiddleware, validateRequest(resetPasswordSchema), authController.resetPassword);
