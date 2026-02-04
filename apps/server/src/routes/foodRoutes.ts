import { Router } from "express";
import { createFoodSchema, updateFoodSchema } from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireUserRole } from "../middlewares/requireUserRole";
import { validateRequest } from "../middlewares/validateRequest";
import { foodController } from "../controllers/foodController";

export const foodRouter = Router();

foodRouter.post(
  "/",
  authMiddleware,
  requireUserRole(["DONOR"]),
  validateRequest(createFoodSchema),
  foodController.create
);

foodRouter.get("/mine", authMiddleware, foodController.listMine);
foodRouter.get("/:foodID", authMiddleware, foodController.getById);

foodRouter.patch(
  "/:foodID",
  authMiddleware,
  requireUserRole(["DONOR"]),
  validateRequest(updateFoodSchema),
  foodController.update
);

foodRouter.delete(
  "/:foodID",
  authMiddleware,
  requireUserRole(["DONOR"]),
  foodController.remove
);
