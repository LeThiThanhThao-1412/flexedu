// frontend/src/services/auth.service.js
import api from './api';

export const authService = {
  register: async (data) => {
  const response = await api.post('/api/auth/register', data);
  // Backend trả về thẳng response.data (chứa success, message, data...)
  if (response.data.success && response.data.data?.accessToken) {
    const { accessToken, refreshToken, user } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }
  return response.data;
},

// frontend/src/services/auth.service.js

login: async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    
    // Backend của Thảo có thể trả về { accessToken, user } 
    // hoặc { data: { accessToken, user } }
    const resData = response.data.data || response.data;

    if (resData && resData.accessToken) {
      localStorage.setItem('accessToken', resData.accessToken);
      // QUAN TRỌNG: Lưu đúng object user vào localStorage
      localStorage.setItem('user', JSON.stringify(resData.user));
      
      return { success: true, user: resData.user };
    }
    return { success: false, message: response.data.message };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Login failed' };
  }
},
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('user');
  },
  
};