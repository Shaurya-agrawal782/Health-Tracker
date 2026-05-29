import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = (
  configuredApiUrl ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '')
).replace(/\/+$/, '');

if (!API_BASE_URL) {
  console.error('VITE_API_URL is missing. Please configure backend API URL.');
  console.error('For Render, set VITE_API_URL to https://your-backend-service.onrender.com/api.');
}

if (!import.meta.env.DEV && API_BASE_URL.startsWith('/')) {
  console.error('VITE_API_URL should be an absolute backend URL in production unless a production proxy is configured.');
}

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT token
API.interceptors.request.use((config) => {
  if (!API_BASE_URL) {
    return Promise.reject(new Error('VITE_API_URL is missing. Please configure backend API URL.'));
  }

  const token = localStorage.getItem('vitaliq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth errors
// Dispatches a custom event instead of doing a hard redirect, so React Router
// can handle navigation cleanly without a full page reload.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  checkHealth: () => API.get('/health'),
  register: (data) => API.post('/auth/register', data),
  sendRegisterOtp: (data) => API.post('/auth/send-register-otp', data),
  guestLogin: () => API.post('/auth/guest'),
  login: (data) => API.post('/auth/login', data),
  verifyOtp: (data) => API.post('/auth/verify-otp', data),
  forgotPassword: (data) => API.post('/auth/forgot-password', data),
  resetPassword: (data) => API.post('/auth/reset-password', data),
  getLeaderboard: () => API.get('/auth/leaderboard'),
  getProfile: () => API.get('/auth/profile'),
  updatePreferences: (data) => API.put('/auth/preferences', data)
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
  getAll: () => API.get('/recommendations'),
  getMealPlan: (data) => API.post('/recommendations/meal-plan', data)
};

// Weekly Check-in APIs
export const weeklyCheckinAPI = {
  create: (data) => API.post('/checkins/weekly', data),
  getAll: () => API.get('/checkins/weekly')
};

export default API;
