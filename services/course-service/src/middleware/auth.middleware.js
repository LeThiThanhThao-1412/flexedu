// services/course-service/src/middleware/auth.middleware.js

const authorize = (roles = []) => {
  return (req, res, next) => {
    // Lấy Role từ Header (do API Gateway hoặc môi trường Test gửi lên)
    const userRole = req.headers['x-user-role'];
    
    if (!userRole || (roles.length && !roles.includes(userRole))) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này!'
      });
    }
    
    next();
  };
};

module.exports = { authorize };