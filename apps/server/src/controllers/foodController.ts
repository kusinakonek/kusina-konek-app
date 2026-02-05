import { NextFunction, Request, Response } from "express";
import {
  CreateFoodInput,
  UpdateFoodInput,
  RequestDonationInput,
} from "@kusinakonek/common";
import { foodService } from "../services/foodService";

export const foodController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateFoodInput;
      const result = await foodService.createFood({
        userID: req.user!.id,
        input,
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.listMyFoods(req.user!.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.getFood({
        userID: req.user!.id,
        foodID: req.params.foodID,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateFoodInput;
      const result = await foodService.updateFood({
        userID: req.user!.id,
        foodID: req.params.foodID,
        input,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.deleteFood({
        userID: req.user!.id,
        foodID: req.params.foodID,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  // Donation-specific controllers with encryption
  async createDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateFoodInput;
      const result = await foodService.createDonation({
        userID: req.user!.id,
        input,
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getAllDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.getAllDonations(req.user!.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getDonationsByUserId(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.getDonationsByUserId({
        requestingUserID: req.user!.id,
        targetUserID: req.params.userID,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getDonationById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.getDonationById({
        userID: req.user!.id,
        foodID: req.params.foodID,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateFoodInput;
      const result = await foodService.updateDonation({
        userID: req.user!.id,
        foodID: req.params.foodID,
        input,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async deleteDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.deleteDonation({
        userID: req.user!.id,
        foodID: req.params.foodID,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async requestDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as RequestDonationInput;
      const result = await foodService.requestDonation({
        recipientID: req.user!.id,
        input,
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
};
