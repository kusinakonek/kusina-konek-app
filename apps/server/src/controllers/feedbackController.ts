import { NextFunction, Request, Response } from "express";
import { CreateFeedbackInput, UpdateFeedbackInput } from "@kusinakonek/common";
import { feedbackService } from "../services/feedbackService";

export const feedbackController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const input = req.body as CreateFeedbackInput;
      const result = await feedbackService.createFeedback({ email: req.user.email, input });
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const input = req.body as UpdateFeedbackInput;
      const feedbackID = req.params.feedbackID;
      const result = await feedbackService.updateFeedback({
        email: req.user.email,
        feedbackID,
        input
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listForDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const result = await feedbackService.listForDistribution({
        email: req.user.email,
        disID: req.params.disID
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async listReceived(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const result = await feedbackService.listReceivedFeedbacks(req.user.email);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};

