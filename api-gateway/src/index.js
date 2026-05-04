require('dotenv').config();
const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình Service URLs
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://flexedu-auth-service:3001',
  user: process.env.USER_SERVICE_URL || 'http://flexedu-user-service:3002',
  course: process.env.COURSE_SERVICE_URL || 'http://flexedu-course-service:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://flexedu-payment-service:3005'
};

// Middleware Global
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Hàm tạo Proxy
const createProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      if (res.headersSent || res.writableEnded) return;
      fixRequestBody(proxyReq, req);
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

// ===== ĐỊNH NGHĨA ROUTES =====

// !!! QUAN TRỌNG: Đặt admin routes TRƯỚC các route thông thường !!!
// Admin routes - Course Service
app.use('/api/admin/courses', createProxy(services.course));
app.use('/api/admin/courses/:id/status', createProxy(services.course));
app.use('/api/admin/courses/:id', createProxy(services.course));

// Admin routes - Auth Service
app.use('/api/admin/users', createProxy(services.auth));

// Auth Service
app.use('/api/auth', createProxy(services.auth));

// Course Service - XỬ LÝ TẤT CẢ (courses, modules, lessons, enrollments, progress)
app.use('/api/courses', createProxy(services.course));
app.use('/api/modules', createProxy(services.course));
app.use('/api/lessons', createProxy(services.course));
app.use('/api/categories', createProxy(services.course));
app.use('/api/progress', createProxy(services.course));
app.use('/api/enrollments', createProxy(services.course));

// Payment Service
app.use('/api/payments', createProxy(services.payment));
app.use('/api/orders', createProxy(services.payment));
app.use('/api/test-success', createProxy(services.payment));

// User Service
app.use('/api/users', createProxy(services.user));

// Health check
app.get('/health', (req, res) => res.json({ status: 'open-gateway-active', services }));

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});