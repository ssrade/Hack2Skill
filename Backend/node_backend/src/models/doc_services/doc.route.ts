import { Router } from "express";
import multer from "multer";
import express from "express";
import { uploadDocument, getUserDocuments, previewDoc, deleteAgreementController } from "./doc.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Ensure JSON body parsing for all routes (redundant safety measure)
router.use(express.json());

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


/**
 * @swagger
 * /docUpload/preview:
 *   post:
 *     tags:
 *       - docUpload
 *     summary: Generate a preview URL for a specific agreement
 *     description: Returns a preview link or URL for the given agreement ID so that users can view the document without downloading it.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agreementId:
 *                 type: string
 *                 description: The unique ID of the agreement to preview
 *                 example: "b12f9e0a-3c44-4b2a-bc99-42f8f52d1e3a"
 *     responses:
 *       200:
 *         description: Successfully generated document preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Document preview generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     previewUrl:
 *                       type: string
 *                       example: "https://storage.googleapis.com/legal-ai-bucket/previews/abc123.pdf"
 *       400:
 *         description: Bad Request - Missing or invalid agreementId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: agreementId is required
 *       404:
 *         description: Agreement not found or preview unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Document not found or cannot be previewed
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 *                 error:
 *                   type: string
 *                   example: Unexpected error occurred
 */

router.post('/preview', previewDoc);

/**
 * @swagger
 * /docUpload/delete:
 *   delete:
 *     tags:
 *       - Agreement
 *     summary: Delete a specific agreement by its ID
 *     description: Permanently deletes an agreement document from the database based on the provided agreement ID.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agreementId:
 *                 type: string
 *                 description: Unique ID of the agreement to be deleted
 *                 example: "b12f9e0a-3c44-4b2a-bc99-42f8f52d1e3a"
 *     responses:
 *       200:
 *         description: Agreement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Agreement deleted successfully
 *       400:
 *         description: Bad Request - Missing or invalid agreementId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: agreementId is required
 *       404:
 *         description: Agreement not found or could not be deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Agreement not found or could not be deleted
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal Server Error
 */
router.delete('/delete', deleteAgreementController);



export default router;
