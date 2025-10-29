import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';
import path from 'path';

// ---------------------------
// Google OAuth2 Client
// ---------------------------
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ---------------------------
// Google Cloud Storage
// ---------------------------
export const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: path.join(__dirname, 'gcp_cred.json'),
});

const bucketName = process.env.GCP_BUCKET_NAME as string;
export const bucket = storage.bucket(bucketName);

// ---------------------------
// Upload File → GCP Storage
// Returns file path for DB storage
// ---------------------------
export const uploadToGCP = async (file: Express.Multer.File) => {
  try {
    const fileName = `uploads/${Date.now()}-${file.originalname}`;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    await new Promise<void>((resolve, reject) => {
      blobStream.on('error', (err) => reject(err));
      blobStream.on('finish', () => resolve());
      blobStream.end(file.buffer);
    });

    // ✅ Return the file path, not signed URL
    return fileName;
  } catch (err) {
    throw new Error(`GCP Upload Error: ${err}`);
  }
};

// ---------------------------
// Generate Signed URL on Demand
// ---------------------------
export const generateSignedUrl = async (filePath: string) => {
  const file = bucket.file(filePath);
  const [url] = await file.getSignedUrl({
    version: 'v4', // UBLA-safe
    action: 'read',
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });

  return url;
};
