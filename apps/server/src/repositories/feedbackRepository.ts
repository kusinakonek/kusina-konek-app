import { prisma } from "@kusinakonek/database";

const defaultInclude = {
  distribution: true,
  donor: { include: { role: true } },
  recipient: { include: { role: true } }
} as const;

export const feedbackRepository = {
  create(data: any) {
    return prisma.feedback.create({ data, include: defaultInclude });
  },

  listForDistribution(disID: string) {
    return prisma.feedback.findMany({
      where: { disID },
      orderBy: { timestamp: "desc" },
      include: defaultInclude
    });
  }
};
