import * as admin from "firebase-admin";
import { prisma } from "@kusinakonek/database";
import { HttpError } from "../middlewares/errorHandler";

// Initialize Firebase Admin SDK
// Uses environment variables for credentials (set in Render)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim().replace(/^"|"$/g, '');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim().replace(/^"|"$/g, '');
  // Handle literal \n, physical newlines, and strip potential quotes. Collapse double newlines if copy-pasted weirdly.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim().replace(/^"|"$/g, '').replace(/\\n/g, "\n").replace(/\n+/g, "\n");

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
      console.log(`[Firebase] Admin SDK initialized successfully for project: ${projectId}`);
    } catch (error: any) {
      console.error("[Firebase] Initialization error:", error.message);
    }
  } else {
    console.warn("=========================================================");
    console.warn("[Firebase] CRITICAL: Missing credentials. Push notifications DISABLED.");
    console.warn("[Firebase] Expected: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    console.warn("[Firebase] Check your environment variables on Render.");
    console.warn("=========================================================");
  }
}

// Helper to calculate distance in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Validate that a token looks like a valid FCM token (not an Expo push token).
 * FCM tokens are typically long base64-like strings.
 */
function isValidFCMToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  // Reject Expo push tokens (they start with ExponentPushToken[)
  if (token.startsWith("ExponentPushToken[")) return false;
  // FCM tokens are typically 100+ characters
  return token.length > 20;
}

export const notificationService = {
  /**
   * Send a push notification directly via Firebase Cloud Messaging (FCM).
   * Bypasses Expo's push service entirely.
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: any = {},
  ) {
    if (!admin.apps.length) {
      console.warn("[PushNotification] Firebase not initialized. Skipping push.");
      return;
    }

    if (!isValidFCMToken(token)) {
      console.error(`[PushNotification] Invalid FCM token: ${token?.substring(0, 30)}...`);
      return;
    }

    try {
      // Convert all data values to strings (FCM requires string values)
      const stringData: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        stringData[key] = String(value ?? "");
      }

      const result = await admin.messaging().send({
        token,
        notification: {
          title,
          body,
        },
        data: stringData,
        android: {
          priority: "high",
          notification: {
            channelId: "default",
            sound: "default",
            priority: "high",
          },
        },
      });

      console.log(`[PushNotification] Sent successfully. Message ID: ${result}`);
    } catch (error: any) {
      console.error("[PushNotification] Error sending push notification:", error.message);

      // Handle specific FCM errors
      if (error.code === "messaging/registration-token-not-registered") {
        console.warn(`[PushNotification] Token expired/invalid. Clearing token from DB.`);
        // Optionally clear the invalid token from the database
        await prisma.user.updateMany({
          where: { pushToken: token },
          data: { pushToken: null },
        });
      }
    }
  },

  /**
   * Send a push notification and return the response (for debugging/test endpoint)
   */
  async sendPushNotificationWithResponse(
    token: string,
    title: string,
    body: string,
    data: any = {},
  ) {
    if (!admin.apps.length) {
      return { error: "Firebase not initialized. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars." };
    }

    if (!isValidFCMToken(token)) {
      return { error: `Invalid FCM token: ${token?.substring(0, 30)}... (Expo push tokens are no longer supported, use device FCM tokens)` };
    }

    try {
      const stringData: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        stringData[key] = String(value ?? "");
      }

      const result = await admin.messaging().send({
        token,
        notification: { title, body },
        data: stringData,
        android: {
          priority: "high",
          notification: {
            channelId: "default",
            sound: "default",
            priority: "high",
          },
        },
      });

      console.log(`[TestNotification] Sent successfully. Message ID: ${result}`);
      return { success: true, messageId: result };
    } catch (error: any) {
      console.error("[TestNotification] FCM error:", error.message);
      return { error: error.message, code: error.code };
    }
  },

  async createInAppNotification(
    userID: string,
    type: string,
    title: string,
    message: string,
    entityID?: string,
  ) {
    await prisma.notification.create({
      data: {
        userID,
        type,
        title,
        message,
        entityID,
        isRead: false,
      },
    });
  },

  /**
   * Notify a user both in-app and via push notification (if they have a push token).
   * Works even when the app is closed — push goes directly through FCM.
   */
  async notifyUser(
    userID: string,
    title: string,
    message: string,
    type: string,
    data: any = {},
    entityID?: string,
  ) {
    // 1. Always create in-app notification
    await this.createInAppNotification(userID, type, title, message, entityID);

    // 2. Send push notification if user has a registered push token
    try {
      const user = await prisma.user.findUnique({
        where: { userID },
        select: { pushToken: true },
      });

      if (user?.pushToken) {
        await this.sendPushNotification(user.pushToken, title, message, {
          ...data,
          type,
          entityID,
        });
      }
    } catch (error) {
      // Don't fail the whole operation if push fails
      console.error("Failed to send push notification to user", userID, error);
    }
  },

  async markAsRead(notificationID: string, userID: string) {
    const result = await prisma.notification.updateMany({
      where: { notificationID, userID },
      data: { isRead: true },
    });

    if (result.count === 0) {
      throw new HttpError(404, "Notification not found");
    }

    return { success: true };
  },

  async deleteNotification(notificationID: string, userID: string) {
    const existing = await prisma.notification.findFirst({
      where: { notificationID, userID },
    });

    if (!existing) {
      throw new HttpError(404, "Notification not found");
    }

    if (existing.type === "CLAIM_BAN") {
      const BAN_DURATION_MS = 3 * 24 * 60 * 60 * 1000;
      const bannedUntil = new Date(existing.createdAt.getTime() + BAN_DURATION_MS);

      if (bannedUntil.getTime() > Date.now()) {
        throw new HttpError(
          403,
          "You cannot delete this claim-ban notice until the restriction period ends.",
        );
      }
    }

    return await prisma.notification.delete({
      where: { notificationID },
    });
  },

  async getUserNotifications(userID: string) {
    return await prisma.notification.findMany({
      where: { userID },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
  },

  /**
   * Broadcast a push notification to all recipients who have a push token.
   * Also creates in-app notifications for each recipient.
   */
  async broadcastToRecipients(title: string, message: string, data: any = {}) {
    try {
      const recipients = await prisma.user.findMany({
        where: {
          role: { roleName: "RECIPIENT" },
        },
        select: { userID: true, pushToken: true },
      });

      // Create in-app notification for ALL recipients
      for (const recipient of recipients) {
        await this.createInAppNotification(
          recipient.userID,
          "NEW_FOOD",
          title,
          message,
        );
      }

      // Send push to those with valid FCM tokens
      const tokensToSend = recipients
        .filter((r) => r.pushToken && isValidFCMToken(r.pushToken));

      if (tokensToSend.length === 0) return;

      console.log(`[PushNotification:Broadcast] Sending to ${tokensToSend.length} recipients`);

      // Send all push notifications in parallel for performance
      const results = await Promise.allSettled(
        tokensToSend.map((recipient) =>
          this.sendPushNotification(recipient.pushToken!, title, message, {
            ...data,
            type: "NEW_FOOD",
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        console.warn(`[PushNotification:Broadcast] ${failed}/${tokensToSend.length} push(es) failed`);
      }
    } catch (error) {
      console.error("[PushNotification:Broadcast] Error broadcasting to recipients", error);
    }
  },

  /**
   * Notify nearby recipients about a new food donation.
   * Calculates distance using the Haversine formula.
   */
  async notifyNearbyRecipients(
    latitude: number,
    longitude: number,
    title: string,
    message: string,
    data: any = {},
    maxDistanceKm: number = 3,
    excludeUserID?: string
  ) {
    try {
      const recipients = await prisma.user.findMany({
        where: {
          role: { roleName: "RECIPIENT" },
        },
        include: {
          userAddress: true,
        },
      });

      const nearbyRecipients = recipients.filter((recipient) => {
        if (excludeUserID && recipient.userID === excludeUserID) return false;
        if (!recipient.userAddress) return false;

        const distance = calculateDistance(
          latitude,
          longitude,
          recipient.userAddress.latitude,
          recipient.userAddress.longitude
        );

        return distance <= maxDistanceKm;
      });

      if (nearbyRecipients.length === 0) return;

      console.log(`[PushNotification:Nearby] Found ${nearbyRecipients.length} nearby recipients`);

      // Create in-app notification for ALL nearby recipients
      for (const recipient of nearbyRecipients) {
        await this.createInAppNotification(
          recipient.userID,
          "NEW_FOOD",
          title,
          message,
        );
      }

      // Send push to those with valid FCM tokens
      const withTokens = nearbyRecipients
        .filter((r) => r.pushToken && isValidFCMToken(r.pushToken));

      if (withTokens.length === 0) return;

      console.log(`[PushNotification:Nearby] Sending push to ${withTokens.length} recipients with tokens`);

      // Send all push notifications in parallel for performance
      const results = await Promise.allSettled(
        withTokens.map((recipient) =>
          this.sendPushNotification(recipient.pushToken!, title, message, {
            ...data,
            type: "NEW_FOOD",
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        console.warn(`[PushNotification:Nearby] ${failed}/${withTokens.length} push(es) failed`);
      }
    } catch (error) {
      console.error("[PushNotification:Nearby] Error notifying nearby recipients", error);
    }
  },
};
