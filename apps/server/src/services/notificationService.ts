import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "@kusinakonek/database";

const expo = new Expo();

export const notificationService = {
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data: any = {},
  ) {
    if (!Expo.isExpoPushToken(token)) {
      console.error(`Push token ${token} is not a valid Expo push token`);
      return;
    }

    const messages: ExpoPushMessage[] = [
      {
        to: token,
        sound: "default",
        title,
        body,
        data,
      },
    ];

    try {
      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          // Log any errors from Expo
          for (const ticket of ticketChunk) {
            if (ticket.status === "error") {
              console.error("Expo push error:", ticket.message, ticket.details);
            }
          }
        } catch (error) {
          console.error("Error sending push notification chunk", error);
        }
      }
    } catch (error) {
      console.error("Error sending push notification", error);
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
   * Works even when the app is closed — push goes through Expo → FCM/APNs.
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

  async markAsRead(notificationID: string) {
    return await prisma.notification.update({
      where: { notificationID },
      data: { isRead: true },
    });
  },

  async deleteNotification(notificationID: string) {
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
   * Used when a new food donation is created.
   */
  async broadcastToRecipients(title: string, message: string, data: any = {}) {
    try {
      // Find all users with RECIPIENT role who have a push token
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

      // Send push to those with tokens
      const tokens = recipients
        .map((r) => r.pushToken!)
        .filter((t) => t && Expo.isExpoPushToken(t));

      if (tokens.length === 0) return;

      const messages: ExpoPushMessage[] = tokens.map((token) => ({
        to: token,
        sound: "default" as const,
        title,
        body: message,
        data: { ...data, type: "NEW_FOOD" },
      }));

      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error("Error broadcasting push notification chunk", error);
        }
      }
    } catch (error) {
      console.error("Error broadcasting to recipients", error);
    }
  },
};
