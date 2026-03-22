// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = authService.getCurrentUser();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  // frontend/src/contexts/AuthContext.jsx

const login = async (email, password) => {
  try {
    const result = await authService.login(email, password);
    
    // Sử dụng ?. để tránh lỗi "undefined"
    if (result?.accessToken || result?.success) {
      // Lấy dữ liệu user từ kết quả trả về
      const userData = result.user || result.data?.user;
      setUser(userData); 
      
      // XÓA DÒNG setIsAuthenticated(true) vì bạn không khai báo state này
      
      return { success: true, user: userData };
    }
    return { success: false, message: result?.message || 'Thông tin không chính xác' };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: 'Server không phản hồi' };
  }
};
  const register = async (data) => {
    const response = await authService.register(data);
    if (response.success && response.data?.accessToken) {
      setUser(response.data.user);
    }
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isInstructor: user?.role === 'INSTRUCTOR',
    isStudent: user?.role === 'STUDENT',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};