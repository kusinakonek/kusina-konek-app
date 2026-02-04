import { NextFunction, Request, Response } from "express";
import { CreateFoodInput, UpdateFoodInput } from "@kusinakonek/common";
import { foodService } from "../services/foodService";

export const foodController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateFoodInput;
      const result = await foodService.createFood({ userID: req.user!.id, input });
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
      const result = await foodService.getFood({ userID: req.user!.id, foodID: req.params.foodID });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateFoodInput;
      const result = await foodService.updateFood({ userID: req.user!.id, foodID: req.params.foodID, input });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await foodService.deleteFood({ userID: req.user!.id, foodID: req.params.foodID });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
