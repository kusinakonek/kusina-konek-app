import { Router } from "express";
import { createDistributionSchema, markDistributionCompleteSchema } from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireUserRole } from "../middlewares/requireUserRole";
import { validateRequest } from "../middlewares/validateRequest";
import { distributionController } from "../controllers/distributionController";

export const distributionRouter = Router();

distributionRouter.post(
  "/",
  authMiddleware,
  requireUserRole(["DONOR"]),
  validateRequest(createDistributionSchema),
  distributionController.create
);

distributionRouter.get("/mine", authMiddleware, distributionController.listMine);

distributionRouter.post(
  "/:disID/complete",
  authMiddleware,
  validateRequest(markDistributionCompleteSchema),
  distributionController.complete
);
