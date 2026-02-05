import { Router } from "express";
import {
  createFoodSchema,
  updateFoodSchema,
  requestDonationSchema,
} from "@kusinakonek/common";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireUserRole } from "../middlewares/requireUserRole";
import { validateRequest } from "../middlewares/validateRequest";
import { foodController } from "../controllers/foodController";

export const foodRouter = Router();

foodRouter.get("/mine", authMiddleware, foodController.listMine);

foodRouter.post(
  "/donations",
  authMiddleware,
  // requireUserRole(["DONOR"]),
  validateRequest(createFoodSchema),
  foodController.createDonation,
);

foodRouter.get("/donations", authMiddleware, foodController.getAllDonations);

// Recipient requests/claims a donation (creates distribution)
foodRouter.post(
  "/donations/request",
  authMiddleware,
  requireUserRole(["RECIPIENT"]),
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
  requireUserRole(["DONOR"]),
  validateRequest(updateFoodSchema),
  foodController.updateDonation,
);

foodRouter.patch(
  "/donations/:foodID",
  authMiddleware,
  requireUserRole(["DONOR"]),
  validateRequest(updateFoodSchema),
  foodController.updateDonation,
);

foodRouter.delete(
  "/donations/:foodID",
  authMiddleware,
  requireUserRole(["DONOR"]),
  foodController.deleteDonation,
);

foodRouter.get("/:foodID", authMiddleware, foodController.getById);
