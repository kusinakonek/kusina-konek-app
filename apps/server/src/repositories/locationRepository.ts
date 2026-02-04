import { prisma } from "@kusinakonek/database";

const defaultInclude = {
  food: true
} as const;

export const locationRepository = {
  create(userID: string, data: any) {
    return prisma.dropOffLocation.create({
      data: { ...data, user: { connect: { userID } } },
      include: defaultInclude
    });
  },

  getById(locID: string) {
    return prisma.dropOffLocation.findUnique({ where: { locID }, include: defaultInclude });
  },

  listByUser(userID: string) {
    return prisma.dropOffLocation.findMany({
      where: { userID },
      orderBy: { locID: "desc" },
      include: defaultInclude
    });
  },

  listByFood(foodID: string) {
    return prisma.dropOffLocation.findMany({
      where: { foodID },
      orderBy: { locID: "desc" },
      include: defaultInclude
    });
  },

  update(locID: string, data: any) {
    return prisma.dropOffLocation.update({ where: { locID }, data, include: defaultInclude });
  },

  delete(locID: string) {
    return prisma.dropOffLocation.delete({ where: { locID } });
  }
};
