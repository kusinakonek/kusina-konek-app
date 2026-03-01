import { prisma } from "@kusinakonek/database";
import { DistributionStatus } from "@prisma/client";

// Full include for detailed views only
const fullInclude = {
  donor: { include: { role: true } },
  recipient: { include: { role: true } },
  location: true,
  food: true,
  feedbacks: true,
} as const;

// Minimal select for list views
const listSelect = {
  disID: true,
  donorID: true,
  recipientID: true,
  locID: true,
  foodID: true,
  quantity: true,
  status: true,
  scheduledTime: true,
  timestamp: true,
  claimedAt: true,
  food: {
    select: {
      foodID: true,
      foodName: true,
      description: true,
      image: true,
    },
  },
  location: {
    select: {
      locID: true,
      streetAddress: true,
      barangay: true,
      latitude: true,
      longitude: true,
    },
  },
  donor: {
    select: {
      userID: true,
      firstName: true,
      lastName: true,
      orgName: true,
    },
  },
} as const;

export const distributionRepository = {
  create(data: any) {
    return prisma.distribution.create({ data, include: fullInclude });
  },

  getById(disID: string) {
    return prisma.distribution.findUnique({
      where: { disID },
      include: fullInclude,
    });
  },

  getByFoodId(foodID: string) {
    return prisma.distribution.findFirst({
      where: { foodID },
      include: fullInclude,
    });
  },

  getAll() {
    return prisma.distribution.findMany({
      where: { status: "PENDING" },
      orderBy: { timestamp: "desc" },
      take: 100,
      select: listSelect,
    });
  },

  listForUser(userID: string) {
    return prisma.distribution.findMany({
      where: { OR: [{ donorID: userID }, { recipientID: userID }] },
      orderBy: { timestamp: "desc" },
      take: 50,
      select: listSelect,
    });
  },

  update(disID: string, data: any) {
    return prisma.distribution.update({
      where: { disID },
      data,
      include: fullInclude,
    });
  },

  updateStatus(disID: string, status: DistributionStatus) {
    return prisma.distribution.update({
      where: { disID },
      data: { status },
      include: fullInclude,
    });
  },

  listAvailable(excludeDonorID?: string, fromDate?: Date) {
    return prisma.distribution.findMany({
      where: {
        status: "PENDING",
        recipientID: null,
        ...(excludeDonorID ? { donorID: { not: excludeDonorID } } : {}),
        ...(fromDate ? { scheduledTime: { gte: fromDate } } : {}),
      },
      orderBy: { scheduledTime: "asc" },
      take: 100,
      select: listSelect,
    });
  },

  listForRecipient(recipientID: string) {
    return prisma.distribution.findMany({
      where: { recipientID },
      orderBy: { claimedAt: "desc" },
      take: 50,
      select: listSelect,
    });
  },

  /**
   * Count how many distributions a recipient has claimed since a given date.
   */
  countClaimsSince(recipientID: string, since: Date) {
    return prisma.distribution.count({
      where: {
        recipientID,
        claimedAt: { gte: since },
        status: { in: ["CLAIMED", "ON_THE_WAY", "DELIVERED", "COMPLETED"] },
      },
    });
  },

  delete(disID: string) {
    return prisma.distribution.delete({
      where: { disID },
    });
  },
};
