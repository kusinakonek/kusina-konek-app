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
      where: { userID: req.authUser.id },
      include: { role: true }
    });

    if (!user || !user.role || !roles.includes(user.role.roleName as Role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
