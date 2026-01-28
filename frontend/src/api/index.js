const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API helper with auth
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
};

// Auth APIs
export const authAPI = {
    getLoginUrl: () => `${API_BASE_URL}/auth/login`,
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

// Chat APIs
export const chatAPI = {
    sendMessage: (message) => apiRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
    }),

    getHistory: () => apiRequest('/api/history'),

    clearHistory: () => apiRequest('/api/history', { method: 'DELETE' }),

    submitFeedback: (question, response, rating) => apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ question, response, rating }),
    }),
};

// Upload APIs
export const uploadAPI = {
    uploadFiles: async (files) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    },

    rebuildKB: (force = false) => apiRequest(`/api/knowledge-base/rebuild?force=${force}`, { method: 'POST' }),
};

// Stats APIs
export const statsAPI = {
    getStats: () => apiRequest('/api/stats'),
    incrementVisit: () => apiRequest('/api/stats/increment', { method: 'POST' }),
    getKBStatus: () => apiRequest('/api/knowledge-base/status'),
};

// Health check
export const healthCheck = () => fetch(`${API_BASE_URL}/health`).then(r => r.json());

export default { authAPI, chatAPI, uploadAPI, statsAPI, healthCheck };
