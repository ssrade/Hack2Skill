import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import {
  signupService,
  loginService,
  updateProfilePhotoService,
  googleLoginService, // ✅ add this
} from './auth.service'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

export const uploadMiddleware = upload.single('photo')

export const signupController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password and name are required' })
    }

    const result = await signupService({ email, password, name })
    return res.status(201).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Signup failed' })
  }
}

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const result = await loginService({ email, password })
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Login failed' })
  }
}

/**
 * Upload profile photo to GCP
 */
export const updateProfilePhotoController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body?.email
    if (!email) {
      return res.status(400).json({ error: 'email is required in body or req.user' })
    }

    const file = req.file as Express.Multer.File | undefined
    if (!file) {
      return res.status(400).json({ error: 'photo file is required' })
    }

    const result = await updateProfilePhotoService(email, file)
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update profile photo' })
  }
}

/**
 * 🔐 Google OAuth Login
 * Body: { idToken: string }
 */
export const googleLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('📥 Google Login Request Received');
    console.log('📋 Request Body:', req.body);
    
    const { idToken } = req.body

    if (!idToken) {
      console.log('❌ No idToken provided');
      return res.status(400).json({ error: 'idToken is required' })
    }

    console.log('✅ idToken received, calling service...');
    const result = await googleLoginService(idToken)
    
    console.log('✅ Service completed, sending response');
    return res.status(200).json(result)
  } catch (err: any) {
    console.error('❌ Google Login Controller Error:', err.message);
    return res.status(400).json({ error: err.message || 'Google login failed' })
  }
}
