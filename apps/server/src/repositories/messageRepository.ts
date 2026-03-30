import { prisma } from "@kusinakonek/database";

const defaultInclude = {
  sender: {
    select: {
      userID: true,
      firstName: true,
      lastName: true,
      orgName: true,
      isOrg: true,
    },
  },
} as const;

export const messageRepository = {
  create(data: any) {
    return prisma.message.create({ data, include: defaultInclude });
  },

  getById(messageID: string) {
    return prisma.message.findUnique({
      where: { messageID },
      include: defaultInclude,
    });
  },

  getByDistribution(disID: string) {
    return prisma.message.findMany({
      where: { disID },
      orderBy: { createdAt: "asc" },
      include: defaultInclude,
    });
  },

  markAsRead(messageID: string) {
    return prisma.message.update({
      where: { messageID },
      data: { isRead: true },
    });
  },

  markAllAsRead(disID: string, userID: string) {
    return prisma.message.updateMany({
      where: {
        disID,
        senderID: { not: userID },
        isRead: false,
      },
      data: { isRead: true },
    });
  },

  getUnreadCount(disID: string, userID: string) {
    return prisma.message.count({
      where: {
        disID,
        senderID: { not: userID },
        isRead: false,
      },
    });
  },

  deleteByDistribution(disID: string) {
    return prisma.message.deleteMany({
      where: { disID },
    });
  },

  update(messageID: string, content: string) {
    return prisma.message.update({
      where: { messageID },
      data: { content },
    });
  },
  
  delete(messageID: string) {
    return prisma.message.delete({
      where: { messageID },
    });
  },
};
