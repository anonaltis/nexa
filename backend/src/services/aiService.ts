import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

export class AIService {
    private static axiosInstance = axios.create({
        baseURL: PYTHON_AI_URL,
        timeout: 15000, // 15 second timeout for complex AI tasks
        headers: {
            'Content-Type': 'application/json',
        },
    });

    /**
     * Generic PCB troubleshooting query
     */
    static async askGemini(question: string): Promise<string> {
        try {
            const response = await this.axiosInstance.post('/ask-gemini', { question });
            return response.data.ai_response;
        } catch (error) {
            this.handleAxiosError(error);
            throw error;
        }
    }

    /**
     * Circuit Analysis (Text-based)
     */
    static async analyzeCircuit(text: string): Promise<any> {
        try {
            const response = await this.axiosInstance.post('/analyze-text', { text });
            return response.data;
        } catch (error) {
            this.handleAxiosError(error);
            throw error;
        }
    }

    /**
     * Code Generation
     */
    static async generateCode(text: string, board: string, circuitData?: any): Promise<string> {
        try {
            const response = await this.axiosInstance.post('/generate-code', { text, board, circuit_data: circuitData });
            return response.data.code;
        } catch (error) {
            this.handleAxiosError(error);
            throw error;
        }
    }

    /**
     * Planning Chat
     */
    static async chatMessage(content: string, projectId?: string): Promise<any> {
        try {
            const response = await this.axiosInstance.post('/chat/message', { content, projectId });
            return response.data;
        } catch (error) {
            this.handleAxiosError(error);
            throw error;
        }
    }

    /**
     * SPICE Simulation
     */
    static async simulateCircuit(description?: string, netlist?: string): Promise<any> {
        try {
            const response = await this.axiosInstance.post('/simulate', { description, netlist });
            return response.data;
        } catch (error) {
            this.handleAxiosError(error);
            throw error;
        }
    }

    /**
     * Code Agent Chat
     */
    static async codeAgentChat(message: string, history: any[], currentCode: string, board: string): Promise<any> {
        try {
            const response = await this.axiosInstance.post('/code-agent/chat', { message, history, current_code: currentCode, board });
            return response.data;
        } catch (error) {
            this.handleAxiosError(error);
            throw error;
        }
    }

    private static handleAxiosError(error: any) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.code === 'ECONNABORTED') {
                throw new Error('TIMEOUT_ERROR');
            }
            if (!axiosError.response) {
                throw new Error('SERVICE_UNAVAILABLE');
            }
        }
    }
}
