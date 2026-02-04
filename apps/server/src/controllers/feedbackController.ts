import { NextFunction, Request, Response } from "express";
import { CreateFeedbackInput } from "@kusinakonek/common";
import { feedbackService } from "../services/feedbackService";

export const feedbackController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as CreateFeedbackInput;
      const result = await feedbackService.createFeedback({ userID: req.user!.id, input });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listForDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feedbackService.listForDistribution({
        userID: req.user!.id,
        disID: req.params.disID
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
