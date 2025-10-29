import { Request, Response, NextFunction } from 'express';
import * as preferenceService from './pref_model.service';
import { GeminiModel } from '@prisma/client';

export const getPreferencesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    const preferences = await preferenceService.getPreferencesService(userId);
    return res.status(200).json({ success: true, preferences });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to get preferences' });
  }
};

export const changeModelPreferencesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { preferredModel } = req.body;

    if (!userId || !preferredModel) {
      return res.status(400).json({ error: 'userId and preferredModel are required' });
    }

    const updated = await preferenceService.changeModelPreferencesService(
      userId,
      preferredModel as GeminiModel
    );

    return res.status(200).json({ success: true, updated });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to update model preference' });
  }
};


export const changeModePreferencesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { preferredMode } = req.body;

    if (!userId || typeof preferredMode !== 'boolean') {
      return res.status(400).json({ error: 'userId and preferredMode(boolean) are required' });
    }

    const updated = await preferenceService.changeModePreferencesService(userId, preferredMode);

    return res.status(200).json({ success: true, updated });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to update mode preference' });
  }
};
