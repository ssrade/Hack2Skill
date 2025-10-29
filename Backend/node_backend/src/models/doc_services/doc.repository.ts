import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const createAgreement = async (
  userId: string,
  title: string,
  gcpFileUrl: string,
  threadId: string,
  description?: string
) => {
  return prisma.agreement.create({
    data: {
      userId,
      title,
      description,
      gcpFileUrl,
      threadId
    },
  });
};

export const getAgreementsByUser = async (userId: string) => {
  return prisma.agreement.findMany({
    where: { userId },
    orderBy: { uploadDate: "desc" },
  });
};

export const getAgreementById = async (id: string) => {
  return prisma.agreement.findUnique({
    where: { id },
  });
};
