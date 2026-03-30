import { NextFunction, Request, Response } from "express";
import { messageService } from "../services/messageService";

export const messageController = {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { disID, messageType, content, imageBase64 } = req.body;

      if (!disID || !messageType) {
        return res.status(400).json({ error: "disID and messageType are required" });
      }

      const result = await messageService.sendMessage({
        userID: req.user!.id,
        disID,
        messageType,
        content,
        imageBase64,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { disID } = req.params;

      if (!disID) {
        return res.status(400).json({ error: "disID is required" });
      }

      const result = await messageService.getMessages({
        userID: req.user!.id,
        disID,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageID } = req.params;

      if (!messageID) {
        return res.status(400).json({ error: "messageID is required" });
      }

      const result = await messageService.markAsRead({
        userID: req.user!.id,
        messageID,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { disID } = req.params;

      if (!disID) {
        return res.status(400).json({ error: "disID is required" });
      }

      const result = await messageService.getUnreadCount({
        userID: req.user!.id,
        disID,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
