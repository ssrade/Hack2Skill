import {Router} from "express";
import { upload, processAgreementController } from "./analysis.controller";

const router = Router();

/**
 * @swagger
 * /agreement/process:
 *   post:
 *     tags:
 *       - Agreement Processing
 *     summary: Upload, mask, and analyze a legal agreement
 *     description: |
 *       Uploads a PDF agreement, masks sensitive information, stores processed content,
 *       and runs a batch analysis pipeline to extract summary, clauses, and risks.
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - agreementId
 *               - docType
 *               - userId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to be processed
 *               agreementId:
 *                 type: string
 *                 example: 8a9b7f-98sd-12cb-9sd8-19eab23
 *               docType:
 *                 type: string
 *                 enum: [electronic, scanned]
 *                 example: electronic
 *               userId:
 *                 type: string
 *                 description: Logged-in user identifier
 *                 example: 1322323qqqw3323
 *
 *     responses:
 *       200:
 *         description: Document processed successfully
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
 *                   example: Agreement processed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                     clauses:
 *                       type: array
 *                       items:
 *                         type: object
 *                     risks:
 *                       type: object
 *
 *       400:
 *         description: Missing required fields or invalid PDF
 *       500:
 *         description: Internal server error during document processing
 */
router.post(
  '/process',
  upload.single("file"),
  processAgreementController
);


export default router;
