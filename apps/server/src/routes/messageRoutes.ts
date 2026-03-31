import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { messageController } from "../controllers/messageController";

export const messageRouter = Router();

// Send a message (text or image)
messageRouter.post("/", authMiddleware, messageController.sendMessage);

// Get all messages for a distribution
messageRouter.get(
  "/distribution/:disID",
  authMiddleware,
  messageController.getMessages
);

// Mark a message as read
messageRouter.patch(
  "/:messageID/read",
  authMiddleware,
  messageController.markAsRead
);

// Get unread message count for a distribution
messageRouter.get(
  "/distribution/:disID/unread-count",
  authMiddleware,
  messageController.getUnreadCount
);

// Delete a message
messageRouter.delete(
  "/:messageID",
  authMiddleware,
  messageController.deleteMessage
);

// Edit a message
messageRouter.patch(
  "/:messageID",
  authMiddleware,
  messageController.editMessage
);
