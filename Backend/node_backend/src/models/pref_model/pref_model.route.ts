import { Router } from 'express';
import {
  getPreferencesController,
  changeModelPreferencesController,
  changeModePreferencesController
} from './pref_model.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Preferences
 *     description: User preferences management
 */

/**
 * @swagger
 * /preferences/{userId}:
 *   get:
 *     tags:
 *       - Preferences
 *     summary: Get user preferences by userId
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User preferences
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 preferences:
 *                   type: object
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/:userId', getPreferencesController);

/**
 * @swagger
 * /preferences/{userId}/model:
 *   patch:
 *     tags:
 *       - Preferences
 *     summary: Change preferred Gemini model for a user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredModel:
 *                 type: string
 *                 enum: [GEMINI_1_5_FLASH, GEMINI_1_5_PRO, GEMINI_2_FLASH, GEMINI_2_PRO]
 *     responses:
 *       200:
 *         description: Updated model preference
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.patch('/:userId/model', changeModelPreferencesController);

/**
 * @swagger
 * /preferences/{userId}/mode:
 *   patch:
 *     tags:
 *       - Preferences
 *     summary: Change preferred mode (boolean) for a user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferredMode:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated mode preference
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.patch('/:userId/mode', changeModePreferencesController);

export default router;
