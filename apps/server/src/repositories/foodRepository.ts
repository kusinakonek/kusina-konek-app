import { prisma } from "@kusinakonek/database";

const defaultInclude = {
  locations: true
} as const;

export const foodRepository = {
  create(userID: string, data: any) {
    return prisma.food.create({
      data: { ...data, user: { connect: { userID } } },
      include: defaultInclude
    });
  },

  getById(foodID: string) {
    return prisma.food.findUnique({ where: { foodID }, include: defaultInclude });
  },

  listByUser(userID: string) {
    return prisma.food.findMany({
      where: { userID },
      orderBy: { timestamp: "desc" },
      include: defaultInclude
    });
  },

  update(foodID: string, data: any) {
    return prisma.food.update({ where: { foodID }, data, include: defaultInclude });
  },

  delete(foodID: string) {
    return prisma.food.delete({ where: { foodID } });
  }
};
