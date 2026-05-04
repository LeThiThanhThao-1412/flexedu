// frontend/src/services/auth.service.js
import api from './api';

export const authService = {
  register: async (data) => {
    const response = await api.post('/api/auth/register', data);
    if (response.data.success && response.data.data?.accessToken) {
      const { accessToken, refreshToken, user } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const resData = response.data.data || response.data;
      if (resData && resData.accessToken) {
        localStorage.setItem('accessToken', resData.accessToken);
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

  // ========== ADMIN USER MANAGEMENT ==========
  adminGetUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data;
  },
  
  adminUpdateUserRole: async (userId, data) => {
    const response = await api.put(`/api/admin/users/${userId}/role`, data);
    return response.data;
  },
  
  adminToggleUserStatus: async (userId) => {
    const response = await api.patch(`/api/admin/users/${userId}/toggle-status`);
    return response.data;
  },
  
  adminDeleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },
};