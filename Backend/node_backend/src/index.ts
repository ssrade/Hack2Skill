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
import chatRouter from "./models/rag_query/rag_query.route"
import { initSpeechWebSocket } from "./models/speechToText/speechToText.controller";
import { authMiddleware } from "./middleware/auth.middleware";

const app = express();

// Middleware
const allowedOrigins = ["http://localhost:5173","https://hack2-skill-three.vercel.app"]; // front-end origin(s)
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  credentials: true // only if you need to send cookies/auth headers
}));

// Body parsing middleware - must come before routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// Register routers
app.use('/auth', authRouter);
app.use('/preferences', prefRouter)
app.use("/speech", speechRouter);
app.use("/docUpload",authMiddleware, docUploadRouter)
app.use("/agreement",authMiddleware, analysisRouter)
app.use("/chat",authMiddleware,chatRouter)


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
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`✅ Server + WebSocket running on port ${PORT}`);
});


export default app;
