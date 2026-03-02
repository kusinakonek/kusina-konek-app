import { prisma } from "@kusinakonek/database";

const defaultUserInclude = {
  role: true,
} as const;

type DisplayNameUser = {
  isOrg: boolean;
  orgName: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
};

const toDisplayName = (user: DisplayNameUser) => {
  if (user.isOrg && user.orgName) return user.orgName;
  const fullName = [user.firstName, user.middleName, user.lastName, user.suffix]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName;
};

export const userRepository = {
  toDisplayName,

  getByUserId(userID: string) {
    return prisma.user.findUnique({
      where: { userID },
      include: defaultUserInclude,
    });
  },

  getByEmailHash(emailHash: string) {
    return prisma.user.findUnique({
      where: { emailHash },
      include: defaultUserInclude,
    });
  },

  getByPhoneNoHash(phoneNoHash: string) {
    return prisma.user.findUnique({
      where: { phoneNoHash },
      include: defaultUserInclude,
    });
  },

  getFirstByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email },
      include: defaultUserInclude,
    });
  },

  create(data: any) {
    return prisma.user.create({ data, include: defaultUserInclude });
  },

  update(userID: string, data: any) {
    return prisma.user.update({
      where: { userID },
      data,
      include: defaultUserInclude,
    });
  },
};
