import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { userRepository } from "../repositories";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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
      const tickets = [];
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
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

  async notifyUser(
    userID: string,
    title: string,
    message: string,
    type: string,
    data: any = {},
    entityID?: string,
  ) {
    // Create In-App Notification
    await this.createInAppNotification(userID, type, title, message, entityID);
  },

  async markAsRead(notificationID: string) {
    return await prisma.notification.update({
      where: { notificationID },
      data: { isRead: true },
    });
  },

  async getUserNotifications(userID: string) {
    return await prisma.notification.findMany({
      where: { userID },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  },
};
