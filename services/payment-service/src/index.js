require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paymentController = require('./controllers/payment.controller');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());

// 1. Webhook cần raw body (Giữ nguyên)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res) => paymentController.handleWebhook(req, res));

// Các route khác dùng JSON
app.use(express.json());

// 2. Các route chính
app.post('/api/orders', (req, res) => paymentController.createOrder(req, res));
app.get('/api/orders', (req, res) => paymentController.getOrders(req, res));

// 3. ROUTE TEST: Ép thanh toán thành công (Bỏ qua Stripe)
// Bạn gọi route này từ Postman để kích hoạt luồng Enrollment
app.post('/api/test-success', (req, res) => paymentController.testInstantSuccess(req, res));

app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.listen(PORT, () => console.log(`✅ Payment Service on port ${PORT}`));