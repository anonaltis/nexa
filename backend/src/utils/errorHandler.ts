import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${err.message}`);

    if (err.message === 'MISSING_QUESTION') {
        return res.status(400).json({ success: false, error: 'Question is required' });
    }

    if (err.message === 'SERVICE_UNAVAILABLE') {
        return res.status(503).json({ success: false, error: 'AI microservice is currently unavailable' });
    }

    if (err.message === 'TIMEOUT_ERROR') {
        return res.status(504).json({ success: false, error: 'AI microservice timed out' });
    }

    res.status(500).json({
        success: false,
        error: 'An unexpected error occurred on the server',
    });
};
