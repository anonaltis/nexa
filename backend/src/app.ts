import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import { authMiddleware } from './middleware/auth';
import { askPCB, analyzeCircuit, generateCode, chatMessage } from './controllers/pcbController';
import { errorHandler } from './utils/errorHandler';

dotenv.config();

const app = express();
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/nexa_db';

// Connect to MongoDB
mongoose.connect(MONGODB_URL)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.use(cors());
app.use(express.json());

// --- 1. HEALTH ---
app.get('/health', (req, res) => res.status(200).json({ status: 'Main Backend is running' }));

// --- 2. AUTH & PROJECTS (Native Node Implementation) ---
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);

// --- 3. AI ENDPOINTS (Protected) ---
app.use('/chat', authMiddleware, (req, res, next) => {
    if (req.path === '/message') return chatMessage(req, res, next);
    next();
});

app.post('/api/pcb/ask', authMiddleware, askPCB);

app.post('/analyze-text', authMiddleware, (req, res, next) => {
    req.body.text = req.body.text || req.body.input;
    analyzeCircuit(req, res, next);
});

app.post('/generate-code', authMiddleware, generateCode);

// Error Handling
app.use(errorHandler);

export default app;
