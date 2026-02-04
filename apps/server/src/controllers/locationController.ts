import { NextFunction, Request, Response } from "express";
import { CreateDropOffLocationInput, UpdateDropOffLocationInput } from "@kusinakonek/common";
import { locationService } from "../services/locationService";

export const locationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateDropOffLocationInput;
      const result = await locationService.createLocation({ userID: req.user!.id, input });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await locationService.listMyLocations(req.user!.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listForFood(req: Request, res: Response, next: NextFunction) {
    try {
      const foodID = req.params.foodID;
      const result = await locationService.listLocationsForFood({ userID: req.user!.id, foodID });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateDropOffLocationInput;
      const result = await locationService.updateLocation({ userID: req.user!.id, locID: req.params.locID, input });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await locationService.deleteLocation({ userID: req.user!.id, locID: req.params.locID });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
