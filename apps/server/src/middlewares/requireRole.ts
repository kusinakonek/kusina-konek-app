import { NextFunction, Response } from "express";
import { prisma } from "@kusinakonek/database";
import { Role } from "@kusinakonek/common";
import { AuthenticatedRequest } from "./requireAuth";

export const requireRole = (roles: Role[]) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser?.id) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.authUser.id }
    });

    if (!user || !roles.includes(user.role as Role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
