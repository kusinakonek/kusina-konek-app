import { prisma } from "@kusinakonek/database";

export const roleRepository = {
  getByName(roleName: string) {
    return prisma.role.findUnique({ where: { roleName } });
  }
};
