import { GeminiModel } from "@prisma/client";
import { prisma } from "../../config/database";

export const getPreferences = async(userId: string) => {
    return prisma.userPreference.findUnique({where: {userId}})
}

export const changeModelPreferences = async(userId: string, preferredModel: GeminiModel) => {
    return prisma.userPreference.update({where: {userId}, data:{preferredModel: preferredModel}})
}

export const changeModePreferences = async(userId: string, darkMode: boolean) => {
    return prisma.userPreference.update({where: {userId}, data:{darkMode: darkMode}})
}

export const createUserPreference = async (userId: string) => {
  return prisma.userPreference.create({
    data: {
      userId: userId,
      // optional: you can also set default values explicitly
      preferredModel: "GEMINI_1_5_PRO",
      darkMode: false,
      notifications: true,
    },
  });
};