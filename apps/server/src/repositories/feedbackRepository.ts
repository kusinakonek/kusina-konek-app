import { prisma } from "@kusinakonek/database";

const defaultInclude = {
  distribution: {
    include: {
      food: true,
      location: true
    }
  },
  donor: { include: { role: true } },
  recipient: { include: { role: true } }
} as const;

export const feedbackRepository = {
  create(data: any) {
    return prisma.feedback.create({ data, include: defaultInclude });
  },

  getById(feedbackID: string) {
    return prisma.feedback.findUnique({
      where: { feedbackID },
      include: defaultInclude
    });
  },

  update(feedbackID: string, data: any) {
    return prisma.feedback.update({
      where: { feedbackID },
      data,
      include: defaultInclude
    });
  },

  listForDistribution(disID: string) {
    return prisma.feedback.findMany({
      where: { disID },
      orderBy: { timestamp: "desc" },
      include: defaultInclude
    });
  },

  listReceived(userID: string) {
    return prisma.feedback.findMany({
      where: { donorID: userID }, // Feedbacks where the user is the donor (recipient gives feedback to donor)
      orderBy: { timestamp: "desc" },
      include: defaultInclude
    });
  }
};
