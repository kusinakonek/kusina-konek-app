import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "@kusinakonek/database";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                role?: string;
            };
        }
    }
}

/**
 * Middleware to verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 */
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Missing or invalid authorization header"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "No token provided"
            });
        }

        // Verify the token using Supabase
        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: error?.message ?? "Invalid or expired token"
            });
        }

        // Attach user info to request
        req.user = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role
        };

        next();
    } catch (error) {
        return res.status(500).json({
            error: "Internal Server Error",
            message: "Authentication failed"
        });
    }
};

/**
 * Middleware to optionally attach user if token is present
 * Does not reject request if no token is provided
 */
export const optionalAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return next();
        }

        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (!error && data.user) {
            req.user = {
                id: data.user.id,
                email: data.user.email,
                role: data.user.user_metadata?.role
            };
        }

        next();
    } catch {
        // Silently continue without user info
        next();
    }
};
