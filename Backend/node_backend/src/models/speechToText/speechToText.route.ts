/**
 * @swagger
 * tags:
 *   - name: Speech
 *     description: Speech to Text Streaming with WebSocket
 */

/**
 * @swagger
 * /speech/test:
 *   get:
 *     tags:
 *       - Speech
 *     summary: Test if Speech-to-Text service is running
 *     description: Returns a simple message indicating that the Speech WebSocket service is active.
 *     responses:
 *       200:
 *         description: Service status message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Backend with Speech WebSocket is running!
 */

/**
 * @swagger
 * /speech/ws:
 *   get:
 *     tags:
 *       - Speech
 *     summary: Get WebSocket endpoint for streaming audio
 *     description: >
 *       Use this endpoint as WebSocket URL to stream raw audio bytes via a frontend client.  
 *       Server will respond with live transcriptions.  
 *
 *       WebSocket URL example: **ws://localhost:8080/speech/ws**
 *
 *       The client must send audio chunks in LINEAR16 format.
 *     responses:
 *       101:
 *         description: WebSocket Switching Protocol (Upgrade from HTTP)
 */

import { Router } from "express";

const router = Router();

router.get("/test", (req, res) => {
  res.json({
    message: "Backend with Speech WebSocket is running!"
  });
});

router.get("/ws", (req, res) => {
  res.status(426).json({
    message:
      "This endpoint only supports WebSocket protocol upgrade. Connect using WebSocket instead."
  });
});

export default router;
