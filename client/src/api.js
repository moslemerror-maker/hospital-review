import axios from 'axios';

// All API calls go through this single object
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Before every request, automatically attach the admin token if it exists
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If a 401 (unauthorized) response comes back, redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminName');
      localStorage.removeItem('adminRole');
      localStorage.removeItem('adminPermissions');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;