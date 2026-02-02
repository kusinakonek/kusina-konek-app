import { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "@kusinakonek/database";

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    email?: string;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "")
    : "";

  if (!token) {
    return res.status(401).json({ message: "Missing access token" });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid access token" });
  }

  req.authUser = {
    id: data.user.id,
    email: data.user.email ?? undefined
  };

  return next();
};
