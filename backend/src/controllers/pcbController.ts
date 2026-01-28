import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/aiService';

export const askPCB = async (req: Request, res: Response, next: NextFunction) => {
    const { question } = req.body;
    if (!question) return next(new Error('MISSING_QUESTION'));
    try {
        const aiResponse = await AIService.askGemini(question);
        res.status(200).json({ success: true, ai_response: aiResponse });
    } catch (error) { next(error); }
};

export const analyzeCircuit = async (req: Request, res: Response, next: NextFunction) => {
    const { text } = req.body;
    if (!text) return next(new Error('MISSING_DATA'));
    try {
        const analysis = await AIService.analyzeCircuit(text);
        res.status(200).json(analysis);
    } catch (error) { next(error); }
};

export const generateCode = async (req: Request, res: Response, next: NextFunction) => {
    const { text, board } = req.body;
    if (!text) return next(new Error('MISSING_DATA'));
    try {
        const code = await AIService.generateCode(text, board || 'esp32');
        res.status(200).json({ code });
    } catch (error) { next(error); }
};

export const chatMessage = async (req: Request, res: Response, next: NextFunction) => {
    const { content, projectId } = req.body;
    if (!content) return next(new Error('MISSING_DATA'));
    try {
        const response = await AIService.chatMessage(content, projectId);
        res.status(200).json(response);
    } catch (error) { next(error); }
};
