import {Router} from "express";
import { upload, processAgreementController, getAnalysis, getUserDocsController, getquestions, generateReportController } from "./analysis.controller";

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

/**
 * @swagger
 * /agreement/analysis/{agreementId}:
 *   get:
 *     tags:
 *       - Agreement Analysis
 *     summary: Fetch processed analysis details for a specific agreement
 *     description: Retrieve summary, clauses, risks, and masked content for the uploaded agreement.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: agreementId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the agreement
 *         example: 8a9b7f-98sd-12cb-9sd8-19eab23
 *
 *     responses:
 *       200:
 *         description: Analysis fetched successfully
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
 *                   example: Analysis details retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: string
 *                     unmaskedSummary:
 *                       type: string
 *                     clauses:
 *                       type: array
 *                       items:
 *                         type: object
 *                     risks:
 *                       type: object
 *
 *       400:
 *         description: Missing or invalid agreementId
 *       404:
 *         description: No analysis found for this agreement
 *       500:
 *         description: Internal server error while fetching analysis data
 */
router.get("/analysis/:agreementId", getAnalysis);

/**
 * @swagger
 * /agreement/allDocuments:
 *   get:
 *     tags:
 *       - Agreements
 *     summary: Get all uploaded documents of a user
 *     description: Fetches list of agreements uploaded by a specific user including docId, title, and description.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique user identifier
 *         example: c0d9612e-adc6-4362-8804-84810e031275
 *
 *     responses:
 *       200:
 *         description: Successfully fetched documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       docId:
 *                         type: string
 *                         example: d629beed-b2d3-47b7-b181-7864ea996af7
 *                       title:
 *                         type: string
 *                         example: Supplier Payment Contract
 *                       description:
 *                         type: string
 *                         example: Contract agreement for financial disbursement
 *
 *       404:
 *         description: No documents found for this user
 *       500:
 *         description: Server error while fetching documents
 */
router.get("/allDocuments", getUserDocsController);


/**
 * @swagger
 * /agreement/questions/{agreementId}:
 *   get:
 *     tags:
 *       - Agreements
 *     summary: Get generated questions for an analyzed agreement
 *     description: Fetches AI-generated question set stored for the given agreement ID.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: agreementId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agreement identifier for which questions are required
 *         example: a8d95732-9c41-44be-b5cc-7ace9a37295e
 *
 *     responses:
 *       200:
 *         description: Questions found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                         example: What are the responsibilities of the supplier regarding fund disbursement?
 *                       type:
 *                         type: string
 *                         example: text
 *                       difficulty:
 *                         type: string
 *                         example: medium
 *
 *       404:
 *         description: No questions found for this agreement
 *       500:
 *         description: Server error while fetching questions
 */

router.get(
  "/questions/:agreementId", getquestions
);

/**
 * @swagger
 * /agreement/report/{agreementId}:
 *   get:
 *     tags:
 *       - Agreements
 *     summary: Download the PDF report of an analyzed agreement
 *     description: Generates and returns a PDF report for the specified agreement.
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: agreementId
 *         required: true
 *         schema:
 *           type: string
 *         example: d629beed-b2d3-47b7-b181-7864ea996af7
 *
 *     responses:
 *       200:
 *         description: PDF file downloaded successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Report not found for this agreement
 *       500:
 *         description: Error generating report
 */
router.get(
  "/report/:agreementId",
  generateReportController
);

export default router;
