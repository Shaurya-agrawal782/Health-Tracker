import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('vitaliq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect if we are NOT already on the login page
    // This prevents clearing the error message during a failed login attempt
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('vitaliq_token');
      localStorage.removeItem('vitaliq_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  sendRegisterOtp: (data) => API.post('/auth/send-register-otp', data),
  login: (data) => API.post('/auth/login', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  getProfile: () => API.get('/auth/profile')
};

// Health APIs (legacy daily tracking)
export const healthAPI = {
  addData: (data) => API.post('/health/add', data),
  getHistory: (params) => API.get('/health/history', { params }),
  getLatest: () => API.get('/health/latest'),
  getRisk: () => API.get('/health/risk'),
  getSummary: (days = 7) => API.get(`/health/summary?days=${days}`),
  chatWithCoach: (messages) => API.post('/health/chat', { messages })
};

// ML Prediction APIs
export const predictAPI = {
  predict: (data) => API.post('/predict', data),
  getById: (id) => API.get(`/predict/${id}`),
  getHistory: (params) => API.get('/predict/history', { params }),
};

// Recommendation APIs
export const recommendationAPI = {
  getAll: () => API.get('/recommendations')
};

export default API;
