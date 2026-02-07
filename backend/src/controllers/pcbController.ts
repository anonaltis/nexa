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
    const { text, board, circuitData } = req.body;
    if (!text) return next(new Error('MISSING_DATA'));
    try {
        const code = await AIService.generateCode(text, board || 'esp32', circuitData);
        res.status(200).json({ code });
    } catch (error) { next(error); }
};

export const codeAgentChat = async (req: Request, res: Response, next: NextFunction) => {
    const { message, history, currentCode, board } = req.body;
    if (!message) return next(new Error('MISSING_MESSAGE'));
    try {
        const response = await AIService.codeAgentChat(message, history || [], currentCode, board || 'esp32');
        res.status(200).json(response);
    } catch (error) { next(error); }
};

export const analyzeImage = async (req: Request, res: Response, next: NextFunction) => {
    const { image, type } = req.body;
    if (!image) return next(new Error('MISSING_IMAGE'));
    try {
        const result = await AIService.analyzeImage(image, type || 'schematic');
        res.status(200).json(result);
    } catch (error) { next(error); }
};

export const recommendComponents = async (req: Request, res: Response, next: NextFunction) => {
    const { requirements, context } = req.body;
    if (!requirements) return next(new Error('MISSING_REQUIREMENTS'));
    try {
        const result = await AIService.recommendComponents(requirements, context);
        res.status(200).json(result);
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

export const simulateCircuit = async (req: Request, res: Response, next: NextFunction) => {
    const { description, netlist } = req.body;
    try {
        const response = await AIService.simulateCircuit(description, netlist);
        res.status(200).json(response);
    } catch (error) { next(error); }
};
