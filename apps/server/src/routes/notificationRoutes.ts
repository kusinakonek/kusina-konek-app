import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { notificationService } from "../services/notificationService";

export const notificationRouter = Router();

// GET /api/notifications — list user's notifications (unread first)
notificationRouter.get("/", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userID = req.user?.id;
        if (!userID) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const notifications = await notificationService.getUserNotifications(userID);
        res.json({ notifications });
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: "Failed to get notifications" });
    }
});

// PUT /api/notifications/:id/read — mark a notification as read
notificationRouter.put("/:id/read", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userID = req.user?.id;
        if (!userID) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const notification = await notificationService.markAsRead(req.params.id);
        res.json({ notification });
    } catch (error) {
        console.error("Mark notification read error:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// DELETE /api/notifications/:id — delete a notification
notificationRouter.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userID = req.user?.id;
        if (!userID) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await notificationService.deleteNotification(req.params.id);
        res.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});
