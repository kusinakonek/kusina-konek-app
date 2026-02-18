import { Router, Request, Response } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { notificationService } from "../services/notificationService";

export const notificationRouter = Router();

// POST /api/notifications/test
notificationRouter.post("/test", authMiddleware, async (req: Request, res: Response) => {
    try {
        const userID = req.user?.id;
        if (!userID) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        await notificationService.notifyUser(
            userID,
            "Test Notification",
            "This is a test notification from the server! 🔔",
            "TEST",
            { screen: "Home" }
        );

        res.json({ message: "Test notification sent" });
    } catch (error) {
        console.error("Test notification error:", error);
        res.status(500).json({ error: "Failed to send test notification" });
    }
});
