// src/index.ts
import express from "express";
import swaggerUi from "swagger-ui-express";
import http from "http";
import authRouter from './models/auth/auth.route';
import prefRouter from './models/pref_model/pref_model.route'
import cors from 'cors'
import swaggerSpec from "./config/swagger";
import speechRouter from "./models/speechToText/speechToText.route"
import analysisRouter from "./models/analysis/analysis.route"
import docUploadRouter from "./models/doc_services/doc.route"
import { initSpeechWebSocket } from "./models/speechToText/speechToText.controller";
import { authMiddleware } from "./middleware/auth.middleware";

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000','http://localhost:3001'], // frontend URL(s)
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Register routers
app.use('/auth', authRouter);
app.use('/preferences', prefRouter)
app.use("/speech", speechRouter);
app.use("/docUpload",authMiddleware, docUploadRouter)
app.use("/agreement",authMiddleware, analysisRouter)


// Swagger UI
if (swaggerSpec) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  app.get('/api/docs', (_req, res) => {
    res.status(404).send('Swagger docs not available. Check server logs.');
  });
}


const server = http.createServer(app);

// Attach WebSocket
initSpeechWebSocket(server);

// Start server
server.listen(3001, () => console.log(`Server + WebSocket running on port`));

export default app;
