// services/payment-service/src/controllers/payment.controller.js
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');
const redisClient = require('../config/redis');
const axios = require('axios');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  // Tạo order và payment intent
  async createOrder(req, res) {
    try {
      const { courseId, amount, currency = 'usd' } = req.body;
      const userId = req.headers['x-user-id'];

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // 1. Tạo order trong DB
      const order = await prisma.order.create({
        data: {
          userId,
          courseId,
          amount,
          currency: currency.toUpperCase(),
          status: 'PENDING'
        }
      });

      // 2. MOCK MODE - Tạo mock payment intent
      const mockPaymentIntent = {
        id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
        client_secret: `secret_mock_${Math.random().toString(36).substr(2, 9)}`
      };

      // 3. Lưu transaction với ID giả
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          paymentIntent: mockPaymentIntent.id,
          amount,
          status: 'PENDING',
          metadata: { clientSecret: mockPaymentIntent.client_secret }
        }
      });

      res.json({
        success: true,
        message: "MOCK MODE: Order created without real Stripe call",
        data: {
          orderId: order.id,
          clientSecret: mockPaymentIntent.client_secret,
          paymentIntentId: mockPaymentIntent.id
        }
      });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Webhook từ Stripe
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await this.handlePaymentSuccess(paymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await this.handlePaymentFailed(failedIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }

  // Xử lý thanh toán thành công
  async handlePaymentSuccess(paymentIntent) {
    try {
      console.log(`🔔 Đang xử lý thanh toán cho Intent: ${paymentIntent.id}`);

      // 1. Tìm transaction và order
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntent: paymentIntent.id },
        include: { order: true }
      });

      if (!transaction) {
        console.error(`❌ Không tìm thấy giao dịch cho ID: ${paymentIntent.id}`);
        return;
      }

      console.log(`📝 Tìm thấy transaction:`, {
        transactionId: transaction.id,
        orderId: transaction.orderId,
        userId: transaction.order.userId,
        courseId: transaction.order.courseId
      });

      // 2. Cập nhật trạng thái thành công trong Database của Payment
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS' }
      });

      await prisma.order.update({
        where: { id: transaction.orderId },
        data: { status: 'COMPLETED' }
      });

      console.log(`✅ Đã cập nhật transaction và order thành công`);

      // 3. Gọi sang Enrollment Service để ghi danh khóa học
      const userIdStr = transaction.order.userId.toString();
      const courseIdStr = transaction.order.courseId.toString();
      
      const enrollmentServiceUrl = process.env.ENROLLMENT_SERVICE_URL || 'http://enrollment-service:3004';
      const enrollmentUrl = `${enrollmentServiceUrl}/api/enrollments/${courseIdStr}`;

      console.log(`🚀 Gửi yêu cầu ghi danh tới: ${enrollmentUrl}`);
      console.log(`📤 Headers: x-user-id: ${userIdStr}`);

      const response = await axios.post(enrollmentUrl, {}, {
        headers: { 
          'x-user-id': userIdStr,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ Ghi danh thành công cho User: ${userIdStr}, Course: ${courseIdStr}`);
      console.log(`📥 Response từ enrollment-service:`, response.data);

    } catch (error) {
      console.error('❌ Lỗi tại handlePaymentSuccess:', error.message);
      if (error.response) {
        console.error('❌ Response error data:', error.response.data);
        console.error('❌ Response error status:', error.response.status);
      }
      console.error('❌ Error config:', error.config);
    }
  }

  // Xử lý thanh toán thất bại
  async handlePaymentFailed(paymentIntent) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { paymentIntent: paymentIntent.id },
        include: { order: true }
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'FAILED' }
        });

        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: 'FAILED' }
        });
      }

      console.log(`Payment failed for intent ${paymentIntent.id}`);
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  // Lấy lịch sử order của user
  async getOrders(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      const cacheKey = `orders:${userId}`;
      
      let orders = await redisClient.get(cacheKey);
      
      if (!orders) {
        orders = await prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        });
        await redisClient.set(cacheKey, JSON.stringify(orders), { EX: 3600 });
      } else {
        orders = JSON.parse(orders);
      }

      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }

  // Test endpoint - Mock payment success
  async testInstantSuccess(req, res) {
    try {
      const { paymentIntentId, courseId, amount } = req.body;
      const userId = req.headers['x-user-id'];
      
      console.log(`🧪 MOCK TEST: Xử lý thanh toán cho User: ${userId}, Course: ${courseId}`);
      
      // Tạo mock payment intent nếu chưa có
      const mockIntentId = paymentIntentId || `pi_mock_${Date.now()}`;
      
      // Tìm hoặc tạo transaction
      let transaction = await prisma.transaction.findUnique({
        where: { paymentIntent: mockIntentId },
        include: { order: true }
      });
      
      if (!transaction && courseId && amount) {
        // Tạo order mới
        const order = await prisma.order.create({
          data: {
            userId,
            courseId,
            amount: amount || 0,
            currency: 'USD',
            status: 'PENDING'
          }
        });
        
        transaction = await prisma.transaction.create({
          data: {
            orderId: order.id,
            paymentIntent: mockIntentId,
            amount: amount || 0,
            status: 'PENDING',
            metadata: { clientSecret: `secret_mock_${Date.now()}` }
          },
          include: { order: true }
        });
      }
      
      if (!transaction) {
        return res.status(400).json({ 
          success: false, 
          message: 'Không tìm thấy giao dịch. Vui lòng tạo order trước.' 
        });
      }
      
      // Gọi hàm xử lý thành công
      await this.handlePaymentSuccess({ id: mockIntentId });
      
      res.json({ 
        success: true, 
        message: "Mock payment confirmed! Đã ghi danh khóa học thành công." 
      });
    } catch (error) {
      console.error('Mock test error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PaymentController();