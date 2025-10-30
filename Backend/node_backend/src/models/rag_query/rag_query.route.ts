import { Router } from "express";
import { fetchMessagesController, queryController } from "./rag_query.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Chat RAG
 *     description: Chat endpoints for conversation and RAG-powered AI responses
 */

/**
 * @swagger
 * /chat/messages/{agreementId}:
 *   get:
 *     tags:
 *       - Chat RAG
 *     summary: Fetch chat messages for an agreement
 *     description: |
 *       Retrieves the most recent chat messages linked to an agreement. 
 *       This automatically resolves the chat session associated with that agreement.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: agreementId
 *         in: path
 *         required: true
 *         description: The unique ID of the agreement
 *         schema:
 *           type: string
 *           example: 41bbf5b3-a826-4ab9-bb03-a1288b7cd032
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of messages to fetch
 *       - name: cursor
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: ID of the last message (for pagination)
 *         security:
 *         - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       sender:
 *                         type: string
 *                         enum: [USER, ASSISTANT]
 *                       content:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 nextCursor:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 hasMore:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error while fetching messages
 */
router.get("/messages/:agreementId", fetchMessagesController);

/**
 * @swagger
 * /chat/query:
 *   post:
 *     tags:
 *       - Chat RAG
 *     summary: Send a user query for a specific agreement
 *     description: |
 *       Sends a user's query to the RAG backend and retrieves an AI-generated response.
 *       The associated chat session is automatically resolved from the agreement ID.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - agreementId
 *             properties:
 *               query:
 *                 type: string
 *                 example: What are the payment terms mentioned in this agreement?
 *               agreementId:
 *                 type: string
 *                 example: 41bbf5b3-a826-4ab9-bb03-a1288b7cd032
 *     responses:
 *       200:
 *         description: Successfully processed the query and retrieved an AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 answer:
 *                   type: string
 *                   example: The agreement outlines confidentiality and payment obligations between both parties.
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error while processing query
 */
router.post("/query", queryController);

export default router;
