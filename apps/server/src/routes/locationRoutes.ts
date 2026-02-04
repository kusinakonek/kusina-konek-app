import { Router } from "express";
import { createDropOffLocationSchema, updateDropOffLocationSchema } from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";
import { locationController } from "../controllers/locationController";

export const locationRouter = Router();

locationRouter.post(
  "/",
  authMiddleware,
  validateRequest(createDropOffLocationSchema),
  locationController.create
);

locationRouter.get("/mine", authMiddleware, locationController.listMine);
locationRouter.get("/food/:foodID", authMiddleware, locationController.listForFood);

locationRouter.patch(
  "/:locID",
  authMiddleware,
  validateRequest(updateDropOffLocationSchema),
  locationController.update
);

locationRouter.delete("/:locID", authMiddleware, locationController.remove);
