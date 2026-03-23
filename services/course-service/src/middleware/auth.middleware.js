// services/course-service/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const axios = require('axios');

const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];
      const token = req.headers.authorization?.split(' ')[1];
      
      console.log('🔍 Auth Debug - userId:', userId);
      console.log('🔍 Auth Debug - userRole:', userRole);
      
      let user = null;
      
      // Ưu tiên dùng userId từ header (do API Gateway gửi)
      if (userId) {
        try {
          // Gọi sang auth service để lấy thông tin user
          const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
          
          const response = await axios.get(`${authServiceUrl}/api/auth/user/${userId}`, {
            headers: {
              'x-user-id': userId,
              'x-user-role': userRole,
              Authorization: token ? `Bearer ${token}` : undefined
            },
            timeout: 5000
          });
          
          if (response.data && response.data.success) {
            user = response.data.data;
            console.log('🔍 User from Auth Service:', user);
          }
        } catch (error) {
          console.error('Error calling auth service:', error.message);
        }
      }
      
      // Nếu không có user, thử lấy từ token
      if (!user && token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          user = {
            id: decoded.userId,
            role: decoded.role,
            isActive: true // Giả định active nếu có token
          };
        } catch (e) {
          console.error('Token verification failed:', e.message);
        }
      }
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      req.user = {
        userId: user.id,
        role: user.role,
        isActive: user.isActive
      };
      
      // 🔥 KIỂM TRA GIẢNG VIÊN CHƯA DUYỆT
      if (user.role === 'INSTRUCTOR' && !user.isActive) {
        console.log('❌ Rejecting: Instructor not active');
        return res.status(403).json({
          success: false,
          message: 'Your instructor account is pending admin approval. Please wait for confirmation before creating courses.'
        });
      }
      
      // Kiểm tra role
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401).json({
        success: false,
        message: 'Authentication failed: ' + error.message
      });
    }
  };
};

module.exports = { authorize };