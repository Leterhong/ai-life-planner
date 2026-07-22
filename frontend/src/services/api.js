import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for agent analysis
});

// User APIs
export const userApi = {
  create: (data) => api.post('/users', data),
  get: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.put(`/users/${userId}/profile`, data),
};

// File APIs
export const fileApi = {
  upload: (file, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (userId) => api.get('/files', { params: { user_id: userId } }),
  getContent: (fileId) => api.get(`/files/${fileId}`),
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

// Plan APIs
export const planApi = {
  create: (userId) => api.post('/plans', { user_id: userId }),
  list: (userId) => api.get('/plans', { params: { user_id: userId } }),
  get: (planId) => api.get(`/plans/${planId}`),
  getProgress: (planId) => api.get(`/plans/${planId}/progress`),
};

// Daily Log APIs
export const logApi = {
  create: (userId, data) => api.post('/logs', data, { params: { user_id: userId } }),
  list: (userId, days = 30) => api.get('/logs', { params: { user_id: userId, days } }),
  getStats: (userId) => api.get('/logs/stats', { params: { user_id: userId } }),
};

export default api;
