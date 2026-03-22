// frontend/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// frontend/src/services/api.js
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        config.headers['x-user-id'] = user.id;
        console.log("🚀 Axios đang gửi ID:", user.id); // Thêm dòng này để debug
      }
    } else {
      console.warn("⚠️ Không tìm thấy user trong localStorage!");
    }
    return config;
  }
);
// Request interceptor - thêm token và user headers
api.interceptors.request.use(
  (config) => {
    // Lấy token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Lấy user info
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
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
    
    console.log('📤 Request:', {
      url: config.url,
      method: config.method,
      headers: {
        Authorization: config.headers.Authorization ? 'Bearer ***' : null,
        'x-user-id': config.headers['x-user-id'],
        'x-user-role': config.headers['x-user-role'],
      }
    });
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;