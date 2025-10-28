import * as preferenceRepository from "./pref_model.repository";
import { GeminiModel } from "@prisma/client";


export const getPreferencesService = async (userId: string) => {
  try {
    const preferences = await preferenceRepository.getPreferences(userId);
    return preferences;
  } catch (error) {
    console.error("Error in getPreferencesService:", error);
    throw new Error("Failed to retrieve user preferences");
  }
};


export const changeModelPreferencesService = async (
  userId: string,
  preferredModel: GeminiModel
) => {
  try {
    const updated = await preferenceRepository.changeModelPreferences(
      userId,
      preferredModel
    );
    return updated;
  } catch (error) {
    console.error("Error in changeModelPreferencesService:", error);
    throw new Error("Failed to update model preference");
  }
};

export const changeModePreferencesService = async(
    userId: string,
    preferredMode: boolean
) => {
    try {
        const updated = await preferenceRepository.changeModePreferences(
            userId,
            preferredMode
        )
        return updated
    } catch (error) {
        throw new Error("failes to update the mode preference")
    }
}