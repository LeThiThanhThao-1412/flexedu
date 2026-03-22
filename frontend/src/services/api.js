// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - thêm user headers (KHÔNG CẦN TOKEN)
api.interceptors.request.use(
  (config) => {
    // Lấy user từ localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // THÊM x-user-id và x-user-role vào header
        if (user.id) {
          config.headers['x-user-id'] = user.id;
        }
        if (user.role) {
          config.headers['x-user-role'] = user.role;
        }
      } catch (e) {
        console.error('Parse user error:', e);
      }
    }
    
    // Nếu có token thì vẫn thêm (cho các service cần)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;