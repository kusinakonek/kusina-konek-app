import { NextFunction, Request, Response } from "express";
import { Role } from "@kusinakonek/common";

export const requireUserRole = (roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const role = req.user.role;
    if (!role || !roles.includes(role as Role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
