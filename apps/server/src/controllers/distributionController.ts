import { NextFunction, Request, Response } from "express";
import { CreateDistributionInput, MarkDistributionCompleteInput } from "@kusinakonek/common";
import { distributionService } from "../services/distributionService";

export const distributionController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateDistributionInput;
      const result = await distributionService.createDistribution({
        donorID: req.user!.id,
        donorRole: req.user?.role,
        input
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.listMyDistributions(req.user!.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as MarkDistributionCompleteInput;
      const result = await distributionService.completeDistribution({
        userID: req.user!.id,
        disID: req.params.disID,
        input
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
