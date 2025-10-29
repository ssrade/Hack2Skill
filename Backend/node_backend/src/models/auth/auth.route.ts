import { Router } from 'express'
import {
  signupController,
  loginController,
  updateProfilePhotoController,
  uploadMiddleware,
  googleLoginController, // ✅ import Google controller
} from './auth.controller'

const router = Router()

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: Created user and token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request / validation error
 */
router.post('/signup', signupController)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authenticated user with token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', loginController)

/**
 * @swagger
 * /auth/profile/photo/add:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Upload / update user profile photo
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - photo
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated user with profile photo URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error / missing file
 */
router.post('/profile/photo/add', uploadMiddleware, updateProfilePhotoController)

/**
 * @swagger
 * /auth/google:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login or sign up using Google OAuth
 *     description: |
 *       Accepts an **ID token** from Google OAuth client (Google Sign-In SDK).
 *       Backend verifies token, creates user if not existing, and returns JWT + user info.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from client
 *     responses:
 *       200:
 *         description: Successfully logged in or signed up
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid or expired ID token
 */
router.post('/google', googleLoginController)

export default router
