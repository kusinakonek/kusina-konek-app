import { Router } from "express";
import {
  createFoodSchema,
  updateFoodSchema,
  requestDonationSchema,
} from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateRequest } from "../middlewares/validateRequest";
import { foodController } from "../controllers/foodController";

export const foodRouter = Router();

foodRouter.get("/mine", authMiddleware, foodController.listMine);

foodRouter.post(
  "/donations",
  authMiddleware,
  validateRequest(createFoodSchema),
  foodController.createDonation,
);

foodRouter.get("/donations", authMiddleware, foodController.getAllDonations);

// Recipient requests/claims a donation (creates distribution)
foodRouter.post(
  "/donations/request",
  authMiddleware,
  validateRequest(requestDonationSchema),
  foodController.requestDonation,
);

foodRouter.get(
  "/donations/user/:userID",
  authMiddleware,
  foodController.getDonationsByUserId,
);

foodRouter.get(
  "/donations/:foodID",
  authMiddleware,
  foodController.getDonationById,
);

foodRouter.put(
  "/donations/:foodID",
  authMiddleware,
  validateRequest(updateFoodSchema),
  foodController.updateDonation,
);

foodRouter.patch(
  "/donations/:foodID",
  authMiddleware,
  validateRequest(updateFoodSchema),
  foodController.updateDonation,
);

foodRouter.delete(
  "/donations/:foodID",
  authMiddleware,
  foodController.deleteDonation,
);

foodRouter.get("/:foodID", authMiddleware, foodController.getById);
