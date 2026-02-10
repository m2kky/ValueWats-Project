import axios from 'axios';

const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;

const api = axios.create({
  baseURL: API_URL,
  // Don't set Content-Type globally — axios auto-detects
  // multipart/form-data for FormData and application/json for objects
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
