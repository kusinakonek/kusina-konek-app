import { prisma } from "@kusinakonek/database";

const defaultInclude = {
  donor: { include: { role: true } },
  recipient: { include: { role: true } },
  location: true,
  food: true,
  feedbacks: true
} as const;

export const distributionRepository = {
  create(data: any) {
    return prisma.distribution.create({ data, include: defaultInclude });
  },

  getById(disID: string) {
    return prisma.distribution.findUnique({ where: { disID }, include: defaultInclude });
  },

  listForUser(userID: string) {
    return prisma.distribution.findMany({
      where: { OR: [{ donorID: userID }, { recipientID: userID }] },
      orderBy: { timestamp: "desc" },
      include: defaultInclude
    });
  },

  update(disID: string, data: any) {
    return prisma.distribution.update({ where: { disID }, data, include: defaultInclude });
  }
};
