import { Router } from 'express';
import { askPCB, analyzeCircuit, generateCode, chatMessage } from '../controllers/pcbController';

const router = Router();

router.post('/ask', askPCB);
router.post('/analyze', analyzeCircuit);
router.post('/generate-code', generateCode);
router.post('/chat', chatMessage);

export default router;
