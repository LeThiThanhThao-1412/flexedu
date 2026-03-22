require('dotenv').config();
const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình Service URLs (Khớp với docker-compose của bạn)
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://flexedu-auth-service:3001',
  user: process.env.USER_SERVICE_URL || 'http://flexedu-user-service:3002',
  course: process.env.COURSE_SERVICE_URL || 'http://flexedu-course-service:3003',
  enrollment: process.env.ENROLLMENT_SERVICE_URL || 'http://flexedu-enrollment-service:3004',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://flexedu-payment-service:3005'
};

// Middleware Global
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Hàm tạo Proxy dùng chung (Đã bỏ check Auth)
const createProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // CHỐT CHẶN 1: Tránh ghi đè khi phản hồi đã gửi đi
      if (res.headersSent || res.writableEnded) {
        return;
      }

      // 1. Sửa lỗi "request aborted" cho các phương thức có Body (POST, PUT, PATCH)
      fixRequestBody(proxyReq, req);
      
      // 2. KHÔNG giả lập nữa: Gateway sẽ tự động forward các Header bạn gửi từ Postman 
      // (như Authorization, x-user-id, x-user-role) sang service con.
      // Chúng ta chỉ cần log để debug xem Gateway đang nhận gì (tùy chọn)
      if (req.headers['x-user-id']) {
        console.log(`[Gateway] Forwarding User ID: ${req.headers['x-user-id']}`);
      }
    },
    proxyTimeout: 60000,
    timeout: 60000,
    onError: (err, req, res) => {
      if (!res.headersSent) {
        console.error(`[Proxy Error]: ${target}`, err.code);
        res.status(502).json({ success: false, message: 'Service is down or unreachable' });
      }
    }
  });
};

// ===== ĐỊNH NGHĨA ROUTES (Tất cả đều trực tiếp, không qua Auth) =====

app.use('/api/auth', createProxy(services.auth));
app.use('/api/courses', createProxy(services.course));
app.use('/api/modules', createProxy(services.course));
app.use('/api/categories', createProxy(services.course));

// 2. QUAN TRỌNG: Kiểm tra và XÓA các dòng trùng lặp /api/progress
// Chỉ để lại dòng này nếu bạn muốn xử lý progress tại Course Service
app.use('/api/progress', createProxy(services.course));

app.use('/api/categories', createProxy(services.course));
app.use('/api/enrollments', createProxy(services.enrollment));
app.use('/api/test-success', createProxy(services.payment)); // THÊM DÒNG NÀY
app.use('/api/progress', createProxy(services.enrollment));
app.use('/api/payments', createProxy(services.payment));
app.use('/api/orders', createProxy(services.payment));
app.use('/api/users', createProxy(services.user));

// Health check
app.get('/health', (req, res) => res.json({ status: 'open-gateway-active', services }));

app.listen(PORT, () => {
  console.log(`🚀 API Gateway (NO-AUTH MODE) running on port ${PORT}`);
});