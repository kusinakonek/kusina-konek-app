import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "@kusinakonek/database";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

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

// In-memory cache for verified tokens (avoids repeated Supabase network calls)
// Key: token hash, Value: { user data, expiry timestamp }
const tokenCache = new Map<
  string,
  { user: { id: string; email?: string; role?: string }; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 500;

function getCacheKey(token: string): string {
  // Use last 32 chars of the token as a fast key (unique enough)
  return token.slice(-32);
}

function cleanupCache() {
  if (tokenCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [key, value] of tokenCache) {
      if (value.expiresAt < now) {
        tokenCache.delete(key);
      }
    }
    // If still too large, clear oldest half
    if (tokenCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(tokenCache.entries());
      entries
        .slice(0, Math.floor(entries.length / 2))
        .forEach(([key]) => tokenCache.delete(key));
    }
  }
}

/**
 * Try to verify the JWT locally first (fast, no network call).
 * Falls back to Supabase /auth/getUser if local verification fails.
 */
async function verifyToken(
  token: string,
): Promise<{ id: string; email?: string; role?: string } | null> {
  // Check cache first
  const cacheKey = getCacheKey(token);
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  // Try local JWT decode first (Supabase JWTs are standard JWTs signed with the JWT_SECRET)
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    if (decoded && decoded.sub) {
      const user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.user_metadata?.role,
      };
      // Cache the result
      cleanupCache();
      tokenCache.set(cacheKey, { user, expiresAt: Date.now() + CACHE_TTL_MS });
      return user;
    }
  } catch {
    // Local verification failed — token might use a different secret or be expired
    // Fall through to Supabase verification
  }

  // Fallback: verify via Supabase (slower, network call)
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    const user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role,
    };
    // Cache the result
    cleanupCache();
    tokenCache.set(cacheKey, { user, expiresAt: Date.now() + CACHE_TTL_MS });
    return user;
  } catch {
    return null;
  }
}

/**
 * Middleware to verify JWT token from Authorization header
 * Expects: Authorization: Bearer <token>
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired token",
      });
    }

    // Use role from X-User-Role header if present (for role switching)
    // Otherwise fall back to JWT metadata role (for backward compatibility)
    const roleHeader = req.headers["x-user-role"] as string | undefined;
    const role = roleHeader || user.role;

    req.user = {
      ...user,
      role,
    };
    next();
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
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
  next: NextFunction,
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

    const user = await verifyToken(token);
    if (user) {
      // Use role from X-User-Role header if present (for role switching)
      // Otherwise fall back to JWT metadata role (for backward compatibility)
      const roleHeader = req.headers["x-user-role"] as string | undefined;
      const role = roleHeader || user.role;

      req.user = {
        ...user,
        role,
      };
    }

    next();
  } catch {
    // Silently continue without user info
    next();
  }
};
