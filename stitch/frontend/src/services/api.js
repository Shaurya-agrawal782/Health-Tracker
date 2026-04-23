import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor — attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('stitch_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('stitch_token');
      localStorage.removeItem('stitch_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile')
};

// Health APIs (legacy daily tracking)
export const healthAPI = {
  addData: (data) => API.post('/health/add', data),
  getHistory: (params) => API.get('/health/history', { params }),
  getLatest: () => API.get('/health/latest'),
  getRisk: () => API.get('/health/risk'),
  getSummary: (days = 7) => API.get(`/health/summary?days=${days}`)
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
