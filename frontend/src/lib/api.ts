
import axios from 'axios';

// Defaults to localhost:8000 (Main Backend)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const STORAGE_KEY = 'access_token';

// Add a request interceptor to attach the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token is invalid or expired
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('user_email');

            // Redirect to login if not already there
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Chat API
 */
export const chatWithAI = async (content: string, projectId?: string, useReasoning: boolean = true, context: string = "general") => {
    const response = await api.post('/chat/message', {
        content,
        projectId,
        use_reasoning: useReasoning,
        context: context
    });
    return response.data;
};

/**
 * Circuit Analysis API (Structured)
 */
export const analyzeCircuit = async (circuitData: any) => {
    const response = await api.post('/analyze', circuitData);
    return response.data;
};

/**
 * Circuit Analysis API (Text-based)
 */
export const analyzeCircuitText = async (text: string, useReasoning: boolean = true) => {
    const response = await api.post('/analyze-text', {
        text,
        use_reasoning: useReasoning
    });
    return response.data;
};

/**
 * Code Generation API
 */
export const generateCode = async (text: string, board: string = "esp32") => {
    const response = await api.post('/generate-code', { text, board });
    return response.data;
};

/**
 * Simulation Agent API
 */
export const simulateCircuit = async (circuit_description: string, simulation_type: string = "auto", useReasoning: boolean = true) => {
    const response = await api.post('/api/simulation/run', {
        circuit_description,
        simulation_type,
        use_cache: true,
        use_reasoning: useReasoning
    });
    return response.data;
};
