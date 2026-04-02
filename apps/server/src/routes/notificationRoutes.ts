import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { notificationService } from "../services/notificationService";
import { prisma } from "@kusinakonek/database";

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

        const notification = await notificationService.markAsRead(req.params.id, userID);
        res.json({ notification });
    } catch (error: any) {
        console.error("Mark notification read error:", error);
        res.status(error?.statusCode || 500).json({ error: error?.message || "Failed to mark notification as read" });
    }
});

// DELETE /api/notifications/:id — delete a notification
notificationRouter.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userID = req.user?.id;
        if (!userID) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await notificationService.deleteNotification(req.params.id, userID);
        res.json({ message: "Notification deleted" });
    } catch (error: any) {
        console.error("Delete notification error:", error);
        res.status(error?.statusCode || 500).json({ error: error?.message || "Failed to delete notification" });
    }
});

// POST /api/notifications/test — send a test push notification to yourself (for debugging)
notificationRouter.post("/test", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userID = req.user?.id;
        if (!userID) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Get the user's push token from DB
        const user = await prisma.user.findUnique({
            where: { userID },
            select: { pushToken: true },
        });

        if (!user?.pushToken) {
            return res.status(400).json({
                error: "No push token found for your account",
                hint: "Make sure you're logged in on the mobile app and the push token was registered.",
            });
        }

        console.log(`[TestNotification] Sending test to token: ${user.pushToken}`);

        // Send directly and capture the ticket response
        const result = await notificationService.sendPushNotificationWithResponse(
            user.pushToken,
            "🔔 Test Notification",
            "If you see this, push notifications are working!",
            { type: "TEST" },
        );

        res.json({
            success: true,
            pushToken: user.pushToken,
            expoTicketResponse: result,
        });
    } catch (error: any) {
        console.error("[TestNotification] Error:", error);
        res.status(500).json({ error: "Failed to send test notification", details: error.message });
    }
});
