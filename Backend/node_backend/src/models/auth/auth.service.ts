import { findUserByEmail, signup, addProfilePhoto } from "./auth.repository";
import * as prefRepo from "../pref_model/pref_model.repository"
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { uploadToGCP } from '../../config/gcp.config';
import multer from 'multer';
import { OAuth2Client } from 'google-auth-library';
import * as userMemory from "../memory/memory.user"

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface SignupData {
    email: string;
    password: string;
    name: string;
}

interface LoginData {
    email: string;
    password: string;
}

/**
 * Normal Signup (Email + Password)
 */
export const signupService = async (data: SignupData) => {
    try {
        const existingUser = await findUserByEmail(data.email);
        if (existingUser) throw new Error('User already exists');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        const { password: _password, ...rest } = data;
        const user = await signup({
            ...rest,
            passwordHash: hashedPassword,
        });

        await prefRepo.createUserPreference(user.id)

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
        );

        await userMemory.addUserToMemory(user.id)

        return { token, user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
        throw error;
    }
};

/**
 * Normal Login (Email + Password)
 */
export const loginService = async (data: LoginData) => {
    try {
        const user = await findUserByEmail(data.email);
        if (!user) throw new Error('User not found');

        const validPassword = await bcrypt.compare(data.password, (user as any).passwordHash);
        if (!validPassword) throw new Error('Invalid password');

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '24h' }
        );
        // await userMemory.warmUserCache(user.id)
        return { token, user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
        throw error;
    }
};

/**
 * Upload Profile Photo to GCP
 */
export const updateProfilePhotoService = async (email: string, file: Express.Multer.File) => {
    try {
        const user = await findUserByEmail(email);
        if (!user) throw new Error('User not found');

        if (!file || !file.buffer) throw new Error('No file provided');

        const publicUrl = await uploadToGCP(file);
        const updatedUser = await addProfilePhoto(publicUrl as string, email);

        return {
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                profilePhoto: updatedUser.profilePhoto,
            },
        };
    } catch (error) {
        throw error;
    }
};

/**
 *  Google OAuth Login Service
 */
export const googleLoginService = async (idToken: string) => {
    try {
        console.log('🔐 Google Login Service Started');
        console.log('📋 ID Token received (first 50 chars):', idToken.substring(0, 50));
        console.log('🔑 GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        console.log('✅ Token verified successfully');

        const payload = ticket.getPayload();
        if (!payload) throw new Error('Invalid Google token');

        const { email, name, picture } = payload;
        console.log('👤 Google User Info:', { email, name, picture });

        // check if user exists
        let user = await findUserByEmail(email!);

        if (!user) {
            console.log('🆕 Creating new user...');
            user = await signup({
                email: email!,
                name: name || 'Google User',
                passwordHash: '', // password empty for Google users
                profilePhoto: picture,
            });
            console.log('✅ User created:', user.id);
            
            await prefRepo.createUserPreference(user.id)
            await userMemory.addUserToMemory(user.id)
        } else {
            console.log('👋 Existing user found:', user.id);
        }

        // generate app token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        console.log('🎫 JWT Token generated (first 50 chars):', token.substring(0, 50));

      //  await userMemory.warmUserCache(user.id)

        const response = {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                profilePhoto: user.profilePhoto,
            },
        };

        console.log('✅ Google Login Service Complete:', { userId: user.id, email: user.email });
        return response;
    } catch (error) {
        console.error('❌ Google Auth Error:', error);
        throw new Error('Google authentication failed');
    }
};
