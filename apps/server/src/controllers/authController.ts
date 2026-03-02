import { NextFunction, Request, Response } from "express";
import { authService, PasswordResetInput, UpdatePasswordInput } from "../services/authService";
import { SignInInput, SignUpInput } from "@kusinakonek/common";
import { AuthenticatedRequest } from "../middlewares/requireAuth";

export const authController = {
  /**
   * POST /api/auth/signup
   * Register a new user
   */
  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as SignUpInput;
      const result = await authService.signUp(input);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   * Sign in with email and password
   */
  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as SignInInput;
      const result = await authService.signIn(input);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Sign out current user
   */
  async signOut(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "No token provided" });
      }

      const result = await authService.signOut(token);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   * Get current user profile (requires authentication)
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await authService.getProfile({
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/forgot-password
   * Request password reset email
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as PasswordResetInput;
      const result = await authService.requestPasswordReset(input);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Update password (requires authentication)
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const input = req.body as UpdatePasswordInput;
      const result = await authService.updatePassword(req.user.id, input);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      const result = await authService.refreshToken(refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/resend-verification
   * Resend email verification
   */
  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const result = await authService.resendVerification(email);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/availability
   * Check if email or phone number is already in use
   */
  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phoneNo } = req.body;
      const result = await authService.checkAvailability(email, phoneNo);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
