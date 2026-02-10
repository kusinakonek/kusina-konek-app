import { prisma } from "@kusinakonek/database";
import { DistributionStatus } from "@prisma/client";

const defaultInclude = {
  donor: { include: { role: true } },
  recipient: { include: { role: true } },
  location: true,
  food: true,
  feedbacks: true,
} as const;

export const distributionRepository = {
  create(data: any) {
    return prisma.distribution.create({ data, include: defaultInclude });
  },

  getById(disID: string) {
    return prisma.distribution.findUnique({
      where: { disID },
      include: defaultInclude,
    });
  },

  getByFoodId(foodID: string) {
    return prisma.distribution.findFirst({
      where: { foodID },
      include: defaultInclude,
    });
  },

  getAll() {
    return prisma.distribution.findMany({
      where: { status: "PENDING" },
      orderBy: { timestamp: "desc" },
      include: defaultInclude,
    });
  },

  listForUser(userID: string) {
    return prisma.distribution.findMany({
      where: { OR: [{ donorID: userID }, { recipientID: userID }] },
      orderBy: { timestamp: "desc" },
      include: defaultInclude,
    });
  },

  update(disID: string, data: any) {
    return prisma.distribution.update({
      where: { disID },
      data,
      include: defaultInclude,
    });
  },

  updateStatus(disID: string, status: DistributionStatus) {
    return prisma.distribution.update({
      where: { disID },
      data: { status },
      include: defaultInclude,
    });
  },

  listAvailable() {
    return prisma.distribution.findMany({
      where: { status: "PENDING", recipientID: null },
      orderBy: { timestamp: "desc" },
      take: 50,
      include: defaultInclude,
    });
  },

  listForRecipient(recipientID: string) {
    return prisma.distribution.findMany({
      where: { recipientID },
      orderBy: { timestamp: "desc" },
      include: defaultInclude,
    });
  },
};
