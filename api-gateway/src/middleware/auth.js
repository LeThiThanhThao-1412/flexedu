// api-gateway/src/middleware/auth.js
const axios = require('axios');

class AuthMiddleware {
  constructor(authServiceUrl) {
    this.authServiceUrl = authServiceUrl;
  }

  async authenticate(req, res, next) {
    try {
      // Lấy token từ header
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No token provided'
        });
      }

      // Gọi sang auth service để verify token
      const response = await axios.post(`${this.authServiceUrl}/api/auth/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      if (response.data.success) {
        // Gắn user info vào request để các service sau dùng
        req.user = response.data.data;
        next();
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.response?.status === 401) {
        const errorData = error.response.data;
        if (errorData.code === 'TOKEN_EXPIRED') {
          return res.status(401).json({
            success: false,
            code: 'TOKEN_EXPIRED',
            message: 'Token expired'
          });
        }
      }
      
      res.status(401).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }

  // Middleware kiểm tra role
  checkRole(allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;