import { NextFunction, Request, Response } from "express";
import {
  CreateDistributionInput,
  MarkDistributionCompleteInput,
  UpdateDistributionInput,
  UpdateDistributionStatusInput,
  RequestDistributionInput,
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
      // Exclude the authenticated user's own donations (anti-cheat)
      const excludeDonorID = req.user?.id;

      // Optional location query params for distance-based sorting
      const lat = req.query.lat
        ? parseFloat(req.query.lat as string)
        : undefined;
      const lng = req.query.lng
        ? parseFloat(req.query.lng as string)
        : undefined;

      const result = await distributionService.listAvailableDistributions(
        excludeDonorID,
        lat,
        lng,
      );
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

  async request(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as RequestDistributionInput;
      const result = await distributionService.requestDistribution({
        userID: req.user!.id,
        userRole: req.user?.role,
        disID: req.params.disID,
        input,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async claimLimits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.getClaimLimits(req.user!.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async markOnTheWay(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await distributionService.markOnTheWay({
        userID: req.user!.id,
        disID: req.params.disID,
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
