import { Router } from "express";
import multer from "multer";
import { uploadDocument, getUserDocuments } from "./doc.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /docUpload/upload:
 *   post:
 *     tags:
 *       - docUpload
 *     summary: Upload a legal agreement document
 *     description: |
 *       Upload a document (PDF/DOCX etc.) to GCP and store metadata linked to the user.
 *       Requires authentication.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - file
 *             properties:
 *               title:
 *                 type: string
 *                 example: Mutual NDA Agreement
 *               description:
 *                 type: string
 *                 example: Uploaded NDA for reviewing terms
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF or Document file upload
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Agreement'
 *       400:
 *         description: Bad request / Missing file
 *       500:
 *         description: Server error during upload
 */
router.post('/upload', upload.single("file"), uploadDocument);

/**
 * @swagger
 * /docUpload:
 *   get:
 *     tags:
 *       - docUpload
 *     summary: Get all agreements uploaded by the authenticated user
 *     description: Fetch list of documents uploaded by the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user agreements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Agreement'
 *       401:
 *         description: Unauthorized - No valid token provided
 *       500:
 *         description: Failed to fetch agreements
 */
router.get('/', getUserDocuments);


export default router;
