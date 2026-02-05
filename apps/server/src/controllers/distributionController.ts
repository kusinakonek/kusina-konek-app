import { NextFunction, Request, Response } from "express";
import {
  CreateDistributionInput,
  MarkDistributionCompleteInput,
  UpdateDistributionInput,
  UpdateDistributionStatusInput,
} from "@kusinakonek/common";
import { distributionService } from "../services/distributionService";

export const distributionController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateDistributionInput;
      const result = await distributionService.createDistribution({
        donorID: req.user!.id,
        donorRole: req.user?.role,
        input,
      });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.getDistribution(
        req.user!.id,
        req.params.disID,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.getAllDistributions(
        req.user!.id,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.listMyDistributions(
        req.user!.id,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateDistributionInput;
      const result = await distributionService.updateDistribution({
        userID: req.user!.id,
        disID: req.params.disID,
        input,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as UpdateDistributionStatusInput;
      const result = await distributionService.updateDistributionStatus({
        userID: req.user!.id,
        disID: req.params.disID,
        input,
      });
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
        input,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listAvailable(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.listAvailableDistributions();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listForRecipient(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.listDistributionsForRecipient(
        req.params.recipientID,
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
